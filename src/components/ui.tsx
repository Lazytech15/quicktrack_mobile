import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography, statusColors, fs, rs } from '../utils/theme';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: 'active' | 'maintenance' | 'offline' | 'decommissioned';
  size?: 'sm' | 'md';
}
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sc = statusColors[status] ?? statusColors.decommissioned;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }, size === 'sm' && styles.badgeSm]}>
      <View style={[styles.badgeDot, { backgroundColor: sc.text }]} />
      <Text style={[styles.badgeText, { color: sc.text }, size === 'sm' && styles.badgeTextSm]}>{label}</Text>
    </View>
  );
};

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}
export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', loading, disabled, icon, style
}) => {
  const variantStyles = {
    primary: { bg: colors.primary, text: colors.textInverse, border: colors.primary },
    secondary: { bg: colors.surface, text: colors.textPrimary, border: colors.border },
    danger: { bg: colors.dangerBg, text: colors.danger, border: colors.danger },
    ghost: { bg: 'transparent', text: colors.primary, border: 'transparent' },
  }[variant];

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: variantStyles.bg, borderColor: variantStyles.border }, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <>
          {icon && <View style={styles.btnIcon}>{icon}</View>}
          <Text style={[styles.btnText, { color: variantStyles.text }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── SectionLabel ────────────────────────────────────────────────────────────
export const SectionLabel: React.FC<{ label: string; style?: TextStyle }> = ({ label, style }) => (
  <Text style={[styles.sectionLabel, style]}>{label.toUpperCase()}</Text>
);

// ─── EmptyState ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Text style={styles.emptyIconText}>📋</Text>
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

// ─── SyncBanner ──────────────────────────────────────────────────────────────
interface SyncBannerProps {
  isConnected: boolean;
  isSyncing: boolean;
  pendingCount?: number;
}
export const SyncBanner: React.FC<SyncBannerProps> = ({ isConnected, isSyncing, pendingCount = 0 }) => {
  if (isConnected && !isSyncing && pendingCount === 0) return null;

  let bg = colors.warningBg;
  let textColor = colors.warning;
  let message = `${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending sync`;

  if (!isConnected) {
    bg = '#F1EFE8';
    textColor = colors.textSecondary;
    message = `Offline mode${pendingCount > 0 ? ` — ${pendingCount} pending` : ''}`;
  } else if (isSyncing) {
    bg = colors.infoBg;
    textColor = colors.info;
    message = 'Syncing to server…';
  }

  return (
    <View style={[styles.syncBanner, { backgroundColor: bg }]}>
      {isSyncing && <ActivityIndicator size="small" color={textColor} style={{ marginRight: 6 }} />}
      <Text style={[styles.syncText, { color: textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(10), paddingVertical: rs(4),
    borderRadius: radius.full, borderWidth: 1,
  },
  badgeSm: { paddingHorizontal: rs(7), paddingVertical: rs(2) },
  badgeDot: { width: rs(6), height: rs(6), borderRadius: 3 },
  badgeText: { fontSize: fs(12), fontWeight: '600' },
  badgeTextSm: { fontSize: fs(11) },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: rs(13),
    borderRadius: radius.md, borderWidth: 1, gap: rs(6),
    minHeight: rs(48),
  },
  btnDisabled: { opacity: 0.45 },
  btnIcon: {},
  btnText: { fontSize: fs(15), fontWeight: '600', letterSpacing: 0.1 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  sectionLabel: {
    fontSize: fs(11), fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 0.8, marginBottom: spacing.sm,
  },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
  emptyIcon: {
    width: rs(64), height: rs(64), borderRadius: rs(32),
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconText: { fontSize: rs(28) },
  emptyTitle: { fontSize: fs(16), fontWeight: '600', color: colors.textSecondary, marginBottom: rs(6) },
  emptySubtitle: { fontSize: fs(14), color: colors.textTertiary, textAlign: 'center', paddingHorizontal: spacing.xl },

  syncBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: rs(9) },
  syncText: { fontSize: fs(13), fontWeight: '500' },
});
