import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { loginWaiter } from '@/services/auth';
import CustomAlert, { AlertButton } from '@/components/Customalert';
import { Image } from 'react-native';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    emoji?: string;
    buttons?: AlertButton[];
  }>({ visible: false, title: '' });

  const showAlert = (
    title: string,
    message?: string,
    type: 'info' | 'success' | 'error' | 'warning' = 'info',
    buttons?: AlertButton[],
    emoji?: string,
  ) => setAlert({ visible: true, title, message, type, buttons, emoji });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing Fields', 'Please enter both email and password.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await loginWaiter({ email: email.trim(), password });
      router.replace('/tables' as any);
    } catch (e: any) {
      showAlert('Login Failed', e?.message ?? 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.inner}>
        {/* Logo / Brand */}
        <View style={styles.logoArea}>
                  <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
          <Text style={styles.brandName}>MIST</Text>
          
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === 'user' && styles.inputFocused]}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onFocus={() => setFocusedField('user')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'pass' && styles.inputFocused]}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In →</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>MIST v1.0  •  Restaurant Edition</Text>
      </View>

      <CustomAlert
        {...alert}
        onDismiss={() => setAlert(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primaryGlow,
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(8,144,0,0.06)',
    bottom: 60,
    left: -60,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoImage: {
  width: 72,
  height: 72,
  marginBottom: Spacing.sm,
},
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceHighlight,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});