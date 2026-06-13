import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { fetchFloors, Floor, Table, TableStatus } from '@/services/tables';
import { clearToken } from '@/services/auth';
// delete the const styles block, add this import
import { styles } from './_styles';

// ─── Status config — covers all 3 backend statuses ───────────────────────────

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; dot: string }> = {
  empty:           { label: 'Empty',         color: Colors.statusEmptyText,     bg: Colors.statusEmpty,     dot: '#444' },
  occupied:        { label: 'Occupied',      color: Colors.statusOccupiedText,  bg: Colors.statusOccupied,  dot: Colors.primary },
  bill_requested:  { label: 'Bill Requested',color: Colors.statusDeliveredText, bg: Colors.statusDelivered, dot: '#d97a4a' },
};

// ─── Filter state shape ───────────────────────────────────────────────────────

type ActiveFilter =
  | { type: 'all' }
  | { type: 'floor'; floorId: string }
  | { type: 'section'; floorId: string; sectionId: string };

export default function TablesScreen() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'all' });

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadFloors = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchFloors();
      setFloors(data);
    } catch (e) {
      setError('Failed to load floor plan. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  // ─── Logout ───────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await clearToken();
    router.replace('/login' as any);
  };

  // ─── Derived data ─────────────────────────────────────────────────────────

  const allTables: Table[] = floors.flatMap(f => f.sections.flatMap(s => s.tables));

  const activeSections =
    activeFilter.type !== 'all'
      ? floors.find(f => f.id === activeFilter.floorId)?.sections ?? []
      : [];

  const filtered: Table[] = (() => {
    if (activeFilter.type === 'all') return allTables;
    if (activeFilter.type === 'floor') {
      return allTables.filter(t => t.floorId === activeFilter.floorId);
    }
    return allTables.filter(t => t.sectionId === activeFilter.sectionId);
  })();

  const stats: Record<TableStatus, number> = {
    empty:          allTables.filter(t => t.status === 'empty').length,
    occupied:       allTables.filter(t => t.status === 'occupied').length,
    bill_requested: allTables.filter(t => t.status === 'bill_requested').length,
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFloorPress = (floorId: string) => {
    if (activeFilter.type === 'floor' && activeFilter.floorId === floorId) {
      setActiveFilter({ type: 'all' });
    } else {
      setActiveFilter({ type: 'floor', floorId });
    }
  };

  const handleSectionPress = (floorId: string, sectionId: string) => {
    if (activeFilter.type === 'section' && activeFilter.sectionId === sectionId) {
      setActiveFilter({ type: 'floor', floorId });
    } else {
      setActiveFilter({ type: 'section', floorId, sectionId });
    }
  };

  const handleTablePress = (table: Table) => {
    router.push({
      pathname: '/order/[tableId]' as any,
      params: {
        tableId: table.id,
        tableNumber: table.number,
        status: table.status,
      },
    });
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading floor plan...</Text>
      </View>
    );
  }

  // ─── List sub-components ──────────────────────────────────────────────────

  const ListHeader = () => (
    <>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️  {error}</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.statsRow}
      >
        {(Object.entries(stats) as [TableStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <View
              key={status}
              style={[styles.statChip, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}
            >
              <View style={[styles.statDot, { backgroundColor: cfg.dot }]} />
              <Text style={[styles.statLabel, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={[styles.statCount, { color: cfg.color }]}>{count}</Text>
            </View>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterBtn, activeFilter.type === 'all' && styles.filterBtnActive]}
          onPress={() => setActiveFilter({ type: 'all' })}
          activeOpacity={0.75}
        >
          <Text style={[styles.filterBtnText, activeFilter.type === 'all' && styles.filterBtnTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {floors.map(floor => {
          const isActive = activeFilter.type !== 'all' && activeFilter.floorId === floor.id;
          return (
            <TouchableOpacity
              key={floor.id}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => handleFloorPress(floor.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                {floor.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeSections.length > 0 && activeFilter.type !== 'all' && (() => {
        const currentFloorId = activeFilter.floorId;
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            contentContainerStyle={styles.sectionRow}
          >
            <TouchableOpacity
              style={[styles.sectionBtn, activeFilter.type === 'floor' && styles.sectionBtnActive]}
              onPress={() => setActiveFilter({ type: 'floor', floorId: currentFloorId })}
              activeOpacity={0.75}
            >
              <Text style={[styles.sectionBtnText, activeFilter.type === 'floor' && styles.sectionBtnTextActive]}>
                All sections
              </Text>
            </TouchableOpacity>

            {activeSections.map(section => {
              const isActive =
                activeFilter.type === 'section' && activeFilter.sectionId === section.id;
              return (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.sectionBtn, isActive && styles.sectionBtnActive]}
                  onPress={() => handleSectionPress(currentFloorId, section.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sectionBtnText, isActive && styles.sectionBtnTextActive]}>
                    {section.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      })()}
    </>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Floor View</Text>
          <Text style={styles.headerSubtitle}>{allTables.length} tables total</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={3}
        key={
          activeFilter.type === 'all'
            ? 'all'
            : activeFilter.type === 'floor'
            ? activeFilter.floorId
            : activeFilter.sectionId
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>No tables found</Text>
          </View>
        }
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadFloors(); }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          const canTakeOrder = item.status === 'occupied';
          const billRequested = item.status === 'bill_requested';
          return (
            <TouchableOpacity
              style={[
                styles.tableCard,
                { backgroundColor: cfg.bg, borderColor: cfg.color + '50' },
              ]}
              onPress={() => handleTablePress(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.tableDot, { backgroundColor: cfg.dot }]} />
              <Text style={styles.tableNumber}>{item.number}</Text>
              <Text style={styles.tableCapacity}>{item.capacity} seats</Text>
              <View style={[styles.tableStatusBadge, { backgroundColor: cfg.color + '22' }]}>
                <Text style={[styles.tableStatusText, { color: cfg.color }]}>
                  {cfg.label}
                </Text>
              </View>
              {(canTakeOrder || billRequested) && (
                <View style={styles.tableAction}>
                  <Text style={styles.tableActionText}>
                    {billRequested ? '🧾' : '📋'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
