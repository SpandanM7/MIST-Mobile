import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  emoji?: string;         // override emoji per call
  type?: 'info' | 'success' | 'error' | 'warning';
  onDismiss?: () => void;
};

const TYPE_CONFIG = {
  info:    { emoji: 'ℹ️',  accent: Colors.textSecondary,  glow: 'rgba(136,136,136,0.12)' },
  success: { emoji: '✅',  accent: Colors.primary,         glow: Colors.primaryGlow       },
  error:   { emoji: '❌',  accent: Colors.error,           glow: 'rgba(224,85,85,0.12)'   },
  warning: { emoji: '⚠️', accent: Colors.warning,         glow: 'rgba(217,167,74,0.12)'  },
};

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  emoji,
  type = 'info',
  onDismiss,
}: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 280,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.88,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
      scale.setValue(0.85);
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type];
  const displayEmoji = emoji ?? cfg.emoji;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }], borderColor: cfg.accent + '40' }]}>

          {/* Glow blob behind emoji */}
          <View style={[styles.emojiGlow, { backgroundColor: cfg.glow }]}>
            <Text style={styles.emoji}>{displayEmoji}</Text>
          </View>

          <Text style={[styles.title, { color: cfg.accent === Colors.primary ? Colors.textPrimary : cfg.accent === Colors.textSecondary ? Colors.textPrimary : cfg.accent }]}>
            {title}
          </Text>

          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Buttons */}
          <View style={[styles.btnRow, buttons.length === 1 && styles.btnRowSingle]}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    buttons.length === 1 && styles.btnFull,
                    isPrimary && { backgroundColor: cfg.accent },
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                    onDismiss?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && styles.btnTextPrimary,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - Spacing.lg * 2, 340),
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  emojiGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
    marginBottom: Spacing.sm,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginTop: Spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  btnRowSingle: {
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  btnFull: {
    flex: 1,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  btnDestructive: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: Colors.white,
  },
  btnTextCancel: {
    color: Colors.textSecondary,
  },
  btnTextDestructive: {
    color: Colors.error,
  },
});