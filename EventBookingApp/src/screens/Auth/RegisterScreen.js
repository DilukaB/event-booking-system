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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FormInput, Button, ErrorBanner } from '../../components';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../theme';

const RegisterScreen = ({ navigation }) => {
  const { register, authError, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    setLoading(true);
    const result = await register(name.trim(), email.toLowerCase().trim(), password);
    setLoading(false);
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
        <View style={styles.headerBg}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🎟️</Text>
            <Text style={styles.appName}>EventPass</Text>
            <Text style={styles.tagline}>Join thousands of event lovers</Text>
          </View>

          <View style={[styles.card, SHADOWS.lg]}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Fill in your details to get started</Text>

            {authError && <ErrorBanner message={authError} onDismiss={clearError} />}

            <FormInput
              label="Full Name"
              value={name}
              onChangeText={(t) => { setName(t); if (errors.name) setErrors(p => ({...p, name: null})); }}
              placeholder="John Doe"
              error={errors.name}
              autoCapitalize="words"
            />

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
              placeholder="At least 6 characters"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showHide}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              }
            />

            <FormInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors(p => ({...p, confirmPassword: null})); }}
              placeholder="Repeat your password"
              secureTextEntry={!showPassword}
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <TouchableOpacity
              onPress={() => { clearError(); navigation.navigate('Login'); }}
              style={styles.loginLink}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkText}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  headerBg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(108, 99, 255, 0.1)', top: -80, left: -60,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255, 101, 132, 0.08)', bottom: -40, right: -40,
  },
  content: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  logoEmoji: { fontSize: 56, marginBottom: SPACING.sm },
  appName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: '800', marginBottom: SPACING.xs },
  cardSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginBottom: SPACING.xl },
  registerButton: { marginTop: SPACING.sm },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.sm, marginTop: SPACING.sm },
  loginText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  loginLinkText: { color: COLORS.primary, fontWeight: '700' },
  showHide: { fontSize: 18 },
});

export default RegisterScreen;
