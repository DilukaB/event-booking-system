import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FormInput, Button, ErrorBanner } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login, authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    setLoading(true);
    const result = await login(email.toLowerCase().trim(), password);
    setLoading(false);
    if (!result.success) {
      // Error is set by context
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Gradient */}
        <View style={styles.headerBg}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🎫</Text>
            <Text style={styles.appName}>EventPass</Text>
            <Text style={styles.tagline}>Your gateway to amazing events</Text>
          </View>

          {/* Login Card */}
          <View style={[styles.card, SHADOWS.lg]}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {authError && <ErrorBanner message={authError} onDismiss={clearError} />}

            <FormInput
              label="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors(p => ({...p, email: null})); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={(t) => { setPassword(t); if (errors.password) setErrors(p => ({...p, password: null})); }}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showHide}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              }
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => { clearError(); navigation.navigate('Register'); }}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLinkText}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    top: -100,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 101, 132, 0.08)',
    bottom: -60,
    left: -60,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.xl,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.sizes.sm,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  registerLinkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  showHide: {
    fontSize: 18,
  },
});

export default LoginScreen;
