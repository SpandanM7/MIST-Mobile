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
import { fetchFloors, Floor, Table, TableStatus } from '@/services/restaurant';

// ─── Status config — covers all 3 backend statuses ───────────────────────────

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; dot: string }> = {
  empty:           { label: 'Empty',         color: Colors.statusEmptyText,     bg: Colors.statusEmpty,     dot: '#444' },
  occupied:        { label: 'Occupied',      color: Colors.statusOccupiedText,  bg: Colors.statusOccupied,  dot: Colors.primary },
  bill_requested:  { label: 'Bill Requested',color: Colors.statusDeliveredText, bg: Colors.statusDelivered, dot: '#d97a4a' },
};

// ─── Filter state shape ───────────────────────────────────────────────────────
// "All" across all floors, or a specific floorId + optional sectionId

type ActiveFilter =
  | { type: 'all' }
  | { type: 'floor'; floorId: string }
  | { type: 'section'; floorId: string; sectionId: string };

export default function TablesScreen() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two-level filter: top row = floors (+ All), bottom row = sections within selected floor
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

  // ─── Derived data ─────────────────────────────────────────────────────────

  // Flat list of all tables across all floors
  const allTables: Table[] = floors.flatMap(f => f.sections.flatMap(s => s.tables));

  // Sections belonging to the currently selected floor (for second filter row)
  const activeSections =
    activeFilter.type !== 'all'
      ? floors.find(f => f.id === activeFilter.floorId)?.sections ?? []
      : [];

  // Filtered tables based on active filter
  const filtered: Table[] = (() => {
    if (activeFilter.type === 'all') return allTables;
    if (activeFilter.type === 'floor') {
      return allTables.filter(t => t.floorId === activeFilter.floorId);
    }
    // type === 'section'
    return allTables.filter(t => t.sectionId === activeFilter.sectionId);
  })();

  // Stats always computed from ALL tables (not filtered) so counts don't change on filter
  const stats: Record<TableStatus, number> = {
    empty:          allTables.filter(t => t.status === 'empty').length,
    occupied:       allTables.filter(t => t.status === 'occupied').length,
    bill_requested: allTables.filter(t => t.status === 'bill_requested').length,
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFloorPress = (floorId: string) => {
    // If already on this floor with no section, toggle back to All
    if (activeFilter.type === 'floor' && activeFilter.floorId === floorId) {
      setActiveFilter({ type: 'all' });
    } else {
      setActiveFilter({ type: 'floor', floorId });
    }
  };

  const handleSectionPress = (floorId: string, sectionId: string) => {
    // If already on this section, collapse back to floor level
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
      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️  {error}</Text>
        </View>
      )}

      {/* Stats row — global counts across all tables */}
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

      {/* Floor filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.filterRow}
      >
        {/* "All" pill */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter.type === 'all' && styles.filterBtnActive,
          ]}
          onPress={() => setActiveFilter({ type: 'all' })}
          activeOpacity={0.75}
        >
          <Text style={[
            styles.filterBtnText,
            activeFilter.type === 'all' && styles.filterBtnTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {floors.map(floor => {
          const isActive =
            activeFilter.type !== 'all' && activeFilter.floorId === floor.id;
          return (
            <TouchableOpacity
              key={floor.id}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => handleFloorPress(floor.id)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.filterBtnText,
                isActive && styles.filterBtnTextActive,
              ]}>
                {floor.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
{/* Section filter row — only visible when a floor is selected */}
      {activeSections.length > 0 && activeFilter.type !== 'all' && (() => {
        const currentFloorId = activeFilter.floorId;
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            alwaysBounceHorizontal={false}
            contentContainerStyle={styles.sectionRow}
          >
            {/* "All sections" within this floor */}
            <TouchableOpacity
              style={[
                styles.sectionBtn,
                activeFilter.type === 'floor' && styles.sectionBtnActive,
              ]}
              onPress={() =>
                setActiveFilter({ type: 'floor', floorId: currentFloorId })
              }
              activeOpacity={0.75}
            >
              <Text style={[
                styles.sectionBtnText,
                activeFilter.type === 'floor' && styles.sectionBtnTextActive,
              ]}>
                All sections
              </Text>
            </TouchableOpacity>

            {activeSections.map(section => {
              const isActive =
                activeFilter.type === 'section' &&
                activeFilter.sectionId === section.id;
              return (
                <TouchableOpacity
                  key={section.id}
                  style={[styles.sectionBtn, isActive && styles.sectionBtnActive]}
                  onPress={() => handleSectionPress(currentFloorId, section.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.sectionBtnText,
                    isActive && styles.sectionBtnTextActive,
                  ]}>
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
        </View>
      </View>

      {/* FlatList owns the scroll — filter rows are inside ListHeaderComponent */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={3}
        // key forces remount when column count is stable but filter changes scroll position
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
              {/* Action hint icon */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },

  // ── Error banner ───────────────────────────────────────────────────────────
  errorBanner: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#2a1a1a',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '60',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Stats Row ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Floor Filter Row ───────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  filterBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.primary,
  },

  // ── Section Filter Row (second level) ─────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  sectionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sectionBtnTextActive: {
    color: Colors.primary,
  },

  // ── Table Grid ─────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  tableCard: {
    flex: 1,
    margin: 5,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 110,
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tableNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tableCapacity: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  tableStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tableAction: {
    position: 'absolute',
    bottom: 7,
    right: 8,
  },
  tableActionText: {
    fontSize: 14,
  },
});