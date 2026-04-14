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
import { fetchTables, Table, TableStatus } from '@/services/restaurant';

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; bg: string; dot: string }> = {
  empty:       { label: 'Empty',        color: Colors.statusEmptyText,     bg: Colors.statusEmpty,     dot: '#444' },
  occupied:    { label: 'Occupied',     color: Colors.statusOccupiedText,  bg: Colors.statusOccupied,  dot: Colors.primary },
  order_taken: { label: 'Order Taken',  color: Colors.statusOrderedText,   bg: Colors.statusOrdered,   dot: '#4a90d9' },
  delivered:   { label: 'Delivered',    color: Colors.statusDeliveredText, bg: Colors.statusDelivered, dot: '#d97a4a' },
};

export default function TablesScreen() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('All');

  const loadTables = useCallback(async () => {
    try {
      const data = await fetchTables();
      setTables(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const sections = ['All', ...Array.from(new Set(tables.map(t => t.section)))];

  const filtered = activeSection === 'All'
    ? tables
    : tables.filter(t => t.section === activeSection);

  const stats = {
    empty:       tables.filter(t => t.status === 'empty').length,
    occupied:    tables.filter(t => t.status === 'occupied').length,
    order_taken: tables.filter(t => t.status === 'order_taken').length,
    delivered:   tables.filter(t => t.status === 'delivered').length,
  };

  const handleTablePress = (table: Table) => {
    router.push({ pathname: '/order/[tableId]' as any, params: { tableId: table.id, tableNumber: table.number, status: table.status } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading floor plan...</Text>
      </View>
    );
  }

  const ListHeader = () => (
    <>
      {/* Stats Row */}
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

      {/* Section Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.sectionRow}
      >
        {sections.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sectionBtn, activeSection === s && styles.sectionBtnActive]}
            onPress={() => setActiveSection(s)}
            activeOpacity={0.75}
          >
            <Text style={[styles.sectionBtnText, activeSection === s && styles.sectionBtnTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header — never moves */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Floor View</Text>
          <Text style={styles.headerSubtitle}>{tables.length} tables total</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* FlatList owns the scroll — filter rows are part of it via ListHeaderComponent */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={3}
        key={activeSection}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadTables(); }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status];
          const canTakeOrder = item.status === 'occupied';
          const canEdit = item.status === 'order_taken';
          return (
            <TouchableOpacity
              style={[styles.tableCard, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}
              onPress={() => handleTablePress(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.tableDot, { backgroundColor: cfg.dot }]} />
              <Text style={styles.tableNumber}>T{item.number}</Text>
              <Text style={styles.tableCapacity}>{item.capacity} seats</Text>
              <View style={[styles.tableStatusBadge, { backgroundColor: cfg.color + '22' }]}>
                <Text style={[styles.tableStatusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              {(canTakeOrder || canEdit) && (
                <View style={styles.tableAction}>
                  <Text style={styles.tableActionText}>
                    {canEdit ? '✏️' : '📋'}
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

  // ── Section Filter Row ─────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionBtnActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  sectionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionBtnTextActive: {
    color: Colors.primary,
  },

  // ── Table Grid ─────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 32,
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