import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Fonts } from '@/constants/theme';
import { PlatformColors } from './platformStyles';
import { Order, getOrderTotal } from './mockOrders';

type Props = {
  order: Order;
  onPress: () => void;
  onAccept: () => void;
  onReject: () => void;
};

export default function OrderCard({ order, onPress, onAccept, onReject }: Props) {
  const colors = PlatformColors[order.platform];
  const total = getOrderTotal(order);
  const itemsPreview = formatItemsPreview(order.items);

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={styles.topRow}>
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
          <Text style={styles.timeText}>{order.placedAgo}</Text>
        </View>

        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.itemsPreview}>{itemsPreview}</Text>

        <View style={styles.bottomRow}>
          <Text style={styles.total}>₹{total}</Text>

          {order.status !== 'pending' && (
            <View
              style={[
                styles.statusBadge,
                order.status === 'accepted'
                  ? styles.statusAccepted
                  : styles.statusRejected,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  order.status === 'accepted'
                    ? styles.statusAcceptedText
                    : styles.statusRejectedText,
                ]}
              >
                {order.status === 'accepted' ? 'ACCEPTED' : 'REJECTED'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {order.status === 'pending' && (
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
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function formatItemsPreview(items: Order['items']) {
  const names = items.map((item) => `${item.quantity}x ${item.name}`);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemsPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusAccepted: {
    backgroundColor: Colors.statusOccupied,
    borderColor: Colors.primary + '50',
  },
  statusRejected: {
    backgroundColor: Colors.statusDelivered,
    borderColor: Colors.error + '50',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusAcceptedText: {
    color: Colors.statusOccupiedText,
  },
  statusRejectedText: {
    color: Colors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '60',
    backgroundColor: 'rgba(224, 85, 85, 0.08)',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});