import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 300);

type DrawerItem = {
  key: string;
  label: string;
  icon: string;
  route: string;
  description: string;
};

const ITEMS: DrawerItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: '🍽️',
    route: '/tables',
    description: 'Floor view & tables',
  },
  {
    key: 'online-orders',
    label: 'Online Orders',
    icon: '🌐',
    route: '/online-orders',
    description: 'Incoming online orders',
  },
  {
    key: 'order-history',
    label: 'Order History',
    icon: '🧾',
    route: '/order-history',
    description: 'Past orders & bills',
  },
];

type Props = {
  visible: boolean;
  activeRoute: string;
  onClose: () => void;
};

export default function DrawerMenu({ visible, activeRoute, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 250);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Brand header */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogoBox}>
            <Text style={styles.drawerLogoEmoji}>🍽️</Text>
          </View>
          <View>
            <Text style={styles.drawerBrand}>MIST</Text>
            <Text style={styles.drawerBrandSub}>Waiter Management</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.navList}>
          {ITEMS.map(item => {
            const isActive = activeRoute === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.75}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <View style={styles.navText}>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.navDescription}>{item.description}</Text>
                </View>
                {isActive && <View style={styles.activePill} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Footer */}
        <Text style={styles.drawerFooter}>MIST v1.0  •  Restaurant Edition</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    paddingTop: 56,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  drawerLogoBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerLogoEmoji: {
    fontSize: 24,
  },
  drawerBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  drawerBrandSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  navList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
  },
  navItemActive: {
    backgroundColor: Colors.primaryGlow,
  },
  navIcon: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  navText: {
    flex: 1,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  navLabelActive: {
    color: Colors.primary,
  },
  navDescription: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activePill: {
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  drawerFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
});