import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '@/constants/theme';
import { PlatformColors } from './platformStyles';
import { Order, getOrderSubtotal, getOrderTotal } from './mockOrders';

type Props = {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
};

export default function OrderDetailModal({
  order,
  visible,
  onClose,
  onAccept,
  onReject,
}: Props) {
  if (!order) return null;

  const colors = PlatformColors[order.platform];
  const subtotal = getOrderSubtotal(order);
  const total = getOrderTotal(order);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* onPress no-op absorbs the touch so it doesn't fall through to the backdrop */}
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.platformTag,
                  { backgroundColor: colors.accentGlow, borderColor: colors.accentBorder },
                ]}
              >
                <Text style={styles.platformIcon}>{colors.icon}</Text>
                <Text style={[styles.platformLabel, { color: colors.accent }]}>
                  {order.orderNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Customer */}
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.metaLine}>{order.customerPhone}</Text>
            <Text style={styles.metaLine}>{order.deliveryAddress}</Text>

            <View style={styles.divider} />

            {/* Items */}
            <Text style={styles.sectionTitle}>ITEMS</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}

            {order.specialInstructions && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>NOTE</Text>
                <Text style={styles.notesText}>{order.specialInstructions}</Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee</Text>
              <Text style={styles.totalValue}>₹{order.deliveryFee}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>₹{total}</Text>
            </View>
            <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>

            {/* Actions */}
            {order.status === 'pending' ? (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  activeOpacity={0.8}
                  onPress={onReject}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.8}
                  onPress={onAccept}
                >
                  <Text style={styles.acceptButtonText}>Accept Order</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.statusBanner,
                  order.status === 'accepted'
                    ? styles.statusAcceptedBanner
                    : styles.statusRejectedBanner,
                ]}
              >
                <Text
                  style={[
                    styles.statusBannerText,
                    order.status === 'accepted'
                      ? styles.statusAcceptedText
                      : styles.statusRejectedText,
                  ]}
                >
                  {order.status === 'accepted' ? 'Order Accepted' : 'Order Rejected'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  platformTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  platformIcon: {
    fontSize: 12,
  },
  platformLabel: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Fonts.mono,
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    padding: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 1,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  grandTotalLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginTop: 4,
  },
  grandTotalValue: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  paymentMethod: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '60',
    backgroundColor: 'rgba(224, 85, 85, 0.08)',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  statusBanner: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderWidth: 1,
  },
  statusAcceptedBanner: {
    backgroundColor: Colors.statusOccupied,
    borderColor: Colors.primary + '50',
  },
  statusRejectedBanner: {
    backgroundColor: Colors.statusDelivered,
    borderColor: Colors.error + '50',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusAcceptedText: {
    color: Colors.statusOccupiedText,
  },
  statusRejectedText: {
    color: Colors.error,
  },
});