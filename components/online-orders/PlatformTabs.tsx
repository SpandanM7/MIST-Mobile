import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { PlatformColors } from './platformStyles';
import { Platform } from './mockOrders';

type Props = {
  active: Platform;
  onChange: (platform: Platform) => void;
  zomatoCount: number;
  swiggyCount: number;
};

export default function PlatformTabs({
  active,
  onChange,
  zomatoCount,
  swiggyCount,
}: Props) {
  const tabs: { key: Platform; count: number }[] = [
    { key: 'zomato', count: zomatoCount },
    { key: 'swiggy', count: swiggyCount },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const colors = PlatformColors[tab.key];

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && {
                  backgroundColor: colors.accentGlow,
                  borderColor: colors.accentBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => onChange(tab.key)}
            >
              <Text style={styles.tabIcon}>{colors.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && { color: colors.accent },
                ]}
              >
                {colors.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    isActive && { backgroundColor: colors.accent },
                  ]}
                >
                  <Text style={styles.countText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});