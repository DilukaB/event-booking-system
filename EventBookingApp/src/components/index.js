import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// ─── Primary Button ────────────────────────────────────────────────────────────
export const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;
  const bgColor =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.error
      : variant === 'outline'
      ? COLORS.transparent
      : COLORS.surfaceLight;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: bgColor },
        variant === 'outline' && styles.outlineButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.buttonText,
              variant === 'outline' && styles.outlineText,
              variant === 'secondary' && styles.secondaryText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────
export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  autoCapitalize,
  rightIcon,
  editable = true,
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.inputDisabled]}>
        <Text
          style={[
            styles.input,
            multiline && { height: numberOfLines ? numberOfLines * 20 + 24 : 80, textAlignVertical: 'top' },
          ]}
        >
          {/* Actual TextInput below */}
        </Text>
        {/* We render via TextInputField below for native input */}
      </View>
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
    </View>
  );
};

// ─── Real TextInput Component (used across screens) ───────────────────────────
import { TextInput } from 'react-native';
export const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  rightIcon,
  editable = true,
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.inputDisabled]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          autoCapitalize={autoCapitalize}
          editable={editable}
          style={[
            styles.textInput,
            multiline && {
              height: numberOfLines * 24 + 24,
              textAlignVertical: 'top',
              paddingTop: SPACING.md,
            },
          ]}
        />
        {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>⚠ {error}</Text>
      ) : null}
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    Active: { color: COLORS.statusActive, bg: 'rgba(0, 200, 150, 0.15)', icon: '✓' },
    'Sold Out': { color: COLORS.statusSoldOut, bg: 'rgba(255, 101, 132, 0.15)', icon: '✕' },
    Cancelled: { color: COLORS.statusCancelled, bg: 'rgba(107, 107, 141, 0.15)', icon: '—' },
    Confirmed: { color: COLORS.statusActive, bg: 'rgba(0, 200, 150, 0.15)', icon: '✓' },
  };
  const config = statusConfig[status] || statusConfig.Cancelled;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.icon} {status}
      </Text>
    </View>
  );
};

// ─── Error Banner ─────────────────────────────────────────────────────────────
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>⚠ {message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.errorBannerDismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title = 'Nothing here yet', subtitle, actionText, onAction }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {actionText && onAction && (
      <TouchableOpacity onPress={onAction} style={styles.emptyAction}>
        <Text style={styles.emptyActionText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Loading Overlay ──────────────────────────────────────────────────────────
export const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, SHADOWS.sm, style]}
    >
      {children}
    </Container>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Button
  button: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineText: {
    color: COLORS.primary,
  },
  secondaryText: {
    color: COLORS.textSecondary,
  },
  iconWrapper: {
    marginRight: SPACING.sm,
  },

  // Input
  inputContainer: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  rightIconWrapper: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    marginTop: 4,
  },

  // Badge
  badge: {
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
  },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  errorBannerText: {
    color: COLORS.error,
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  errorBannerDismiss: {
    color: COLORS.error,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    paddingLeft: SPACING.sm,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.base,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyAction: {
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  emptyActionText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONTS.sizes.base,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.base,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.sm,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
});
