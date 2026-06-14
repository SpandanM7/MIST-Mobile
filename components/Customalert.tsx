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
  emoji?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onDismiss?: () => void;
};

const TYPE_CONFIG = {
  info:    { emoji: 'ℹ️',  accent: Colors.textSecondary, glow: 'rgba(136,136,136,0.10)' },
  success: { emoji: '✅',  accent: Colors.primary,        glow: Colors.primaryGlow       },
  error:   { emoji: '❌',  accent: Colors.error,          glow: 'rgba(224,85,85,0.10)'   },
  warning: { emoji: '⚠️', accent: Colors.warning,        glow: 'rgba(217,167,74,0.10)'  },
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
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.88);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type];
  const displayEmoji = emoji ?? cfg.emoji;
  const isSingle = buttons.length === 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale }], borderColor: cfg.accent + '30' },
          ]}
        >
          {/* Emoji blob */}
          <View style={[styles.emojiWrap, { backgroundColor: cfg.glow }]}>
            <Text style={styles.emoji}>{displayEmoji}</Text>
          </View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={styles.divider} />
          <View style={[styles.btnRow, isSingle && styles.btnRowSingle]}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;
              const isNotLast = i < buttons.length - 1;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isSingle && styles.btnSingle,
                    isPrimary && isSingle && { backgroundColor: cfg.accent },
                    isNotLast && styles.btnBorderRight,
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                    onDismiss?.();
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && isSingle && styles.btnTextPrimary,
                      isPrimary && !isSingle && { color: cfg.accent },
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

const CARD_WIDTH = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 320);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 0,
  },
  emojiWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  divider: {
    width: CARD_WIDTH,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.surfaceBorder,
    marginTop: Spacing.md,
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
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSingle: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 13,
  },
  btnBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.surfaceBorder,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
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