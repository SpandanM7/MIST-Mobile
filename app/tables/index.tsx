import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { fetchFloors, Floor, Table, TableStatus } from '@/services/tables';
import { clearToken } from '@/services/auth';
import { styles } from './_styles';
import DrawerMenu from '@/components/DrawerMenu';

// ─── Status config — covers all 3 backend statuses ───────────────────────────

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; dot: string }> = {
  empty:           { label: 'Empty',          color: Colors.statusEmptyText,     bg: Colors.statusEmpty,     dot: '#444' },
  occupied:        { label: 'Occupied',       color: Colors.statusOccupiedText,  bg: Colors.statusOccupied,  dot: Colors.primary },
  bill_requested:  { label: 'Bill Requested', color: Colors.statusDeliveredText, bg: Colors.statusDelivered, dot: '#d97a4a' },
};

// ─── Filter state shape ───────────────────────────────────────────────────────

type ActiveFilter =
  | { type: 'all' }
  | { type: 'floor'; floorId: string }
  | { type: 'section'; floorId: string; sectionId: string };

export default function TablesScreen() {
  const insets = useSafeAreaInsets();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ type: 'floor', floorId: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadFloors = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchFloors();
setFloors(data);
if (data.length > 0) {
  const firstFloor = data[0];
  const firstSection = firstFloor.sections?.[0];
  if (firstSection) {
    setActiveFilter({ type: 'section', floorId: firstFloor.id, sectionId: firstSection.id });
  } else {
    setActiveFilter({ type: 'floor', floorId: firstFloor.id });
  }
}
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
  const floor = floors.find(f => f.id === floorId);
  const firstSection = floor?.sections?.[0];
  if (firstSection) {
    setActiveFilter({ type: 'section', floorId, sectionId: firstSection.id });
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

  // FAB sits above the Android 3-button nav bar
  const fabBottom = insets.bottom + 20;

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Hamburger */}
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.bar} />
            <View style={[styles.bar, styles.barMid]} />
            <View style={styles.bar} />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Floor View</Text>
            <Text style={styles.headerSubtitle}>{allTables.length} tables total</Text>
          </View>
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
        // Extra bottom padding so last row of cards never slides under the FAB
        contentContainerStyle={[styles.grid, { paddingBottom: fabBottom + 72 }]}
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

      {/* Takeout FAB — floats above Android nav bar */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => router.push('/order/takeout' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>🥡</Text>
      </TouchableOpacity>

      {/* Drawer */}
      <DrawerMenu
        visible={drawerOpen}
        activeRoute="home"
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}