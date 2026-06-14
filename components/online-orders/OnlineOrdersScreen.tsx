import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import DrawerMenu from '@/components/DrawerMenu';
import PlatformTabs from './PlatformTabs';
import OrderCard from './OrderCard';
import OrderDetailModal from './OrderDetailModal';
import { initialOrders, Order, Platform } from './mockOrders';

export default function OnlineOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>('zomato');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => o.platform === platform);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;

  const zomatoPendingCount = orders.filter(
    (o) => o.platform === 'zomato' && o.status === 'pending'
  ).length;
  const swiggyPendingCount = orders.filter(
    (o) => o.platform === 'swiggy' && o.status === 'pending'
  ).length;

  const updateStatus = (id: string, status: 'accepted' | 'rejected') => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const confirmAccept = (order: Order) => {
    Alert.alert(
      'Accept Order',
      `Accept order ${order.orderNumber} from ${order.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            updateStatus(order.id, 'accepted');
            setSelectedOrderId(null);
          },
        },
      ]
    );
  };

  const confirmReject = (order: Order) => {
    Alert.alert(
      'Reject Order',
      `Reject order ${order.orderNumber} from ${order.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            updateStatus(order.id, 'rejected');
            setSelectedOrderId(null);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
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
          <Text style={styles.headerTitle}>Online Orders</Text>
          <Text style={styles.headerSubtitle}>Incoming orders from online platforms</Text>
        </View>
      </View>

      <PlatformTabs
        active={platform}
        onChange={setPlatform}
        zomatoCount={zomatoPendingCount}
        swiggyCount={swiggyPendingCount}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => setSelectedOrderId(item.id)}
            onAccept={() => confirmAccept(item)}
            onReject={() => confirmReject(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders from this platform yet.</Text>
          </View>
        }
      />

      <OrderDetailModal
        order={selectedOrder}
        visible={!!selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onAccept={() => selectedOrder && confirmAccept(selectedOrder)}
        onReject={() => selectedOrder && confirmReject(selectedOrder)}
      />

      <DrawerMenu
        visible={drawerOpen}
        activeRoute="online-orders"
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  hamburger: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    height: 2,
    width: 22,
    backgroundColor: Colors.textPrimary,
    borderRadius: 2,
  },
  barMid: {
    width: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});