import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors, Spacing, Radius } from '@/constants/theme';
import DrawerMenu from '@/components/DrawerMenu';
import { TouchableOpacity } from 'react-native';

// Reuse this single file for both /online-orders and /order-history
// by reading the route segment from params or just checking the file name.
// Each screen file just passes its own config as props — see usage below.

type Props = {
  icon: string;
  title: string;
  subtitle: string;
  drawerKey: string;
  comingSoonLabel: string;
};

export default function PlaceholderScreen({
  icon,
  title,
  subtitle,
  drawerKey,
  comingSoonLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {/* Coming soon body */}
      <View style={styles.body}>
        <View style={styles.iconRing}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
        <Text style={styles.comingSoonBadge}>COMING SOON</Text>
        <Text style={styles.comingSoonTitle}>{comingSoonLabel}</Text>
        <Text style={styles.comingSoonBody}>
          This section is under construction. Check back in a future update.
        </Text>

        {/* Skeleton rows to show it'll have content */}
        <View style={styles.skeletonCard}>
          <View style={[styles.skeletonLine, { width: '60%' }]} />
          <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
        </View>
        <View style={styles.skeletonCard}>
          <View style={[styles.skeletonLine, { width: '75%' }]} />
          <View style={[styles.skeletonLine, { width: '50%', marginTop: 8 }]} />
        </View>
        <View style={[styles.skeletonCard, { opacity: 0.4 }]}>
          <View style={[styles.skeletonLine, { width: '55%' }]} />
          <View style={[styles.skeletonLine, { width: '35%', marginTop: 8 }]} />
        </View>
      </View>

      <DrawerMenu
        visible={drawerOpen}
        activeRoute={drawerKey}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
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
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconEmoji: {
    fontSize: 36,
  },
  comingSoonBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    overflow: 'hidden',
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
    marginBottom: 32,
  },
  skeletonCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: 10,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
  },
});