import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { MonthlyAllocation } from '@/store/useFinanceStore';
import { FundBalances } from '@/types/finance';

function formatGrouped(n: number): string {
  const rounded = Math.max(0, Math.round(n));
  const s = rounded.toString();
  let out = '';
  for (let i = s.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) out = ',' + out;
    out = s[i] + out;
  }
  return out;
}

type Props = {
  visible: boolean;
  month: number;
  allocation: MonthlyAllocation;
  currentBalances: FundBalances;
  emergencyTarget: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function LogMonthSheet({
  visible,
  month,
  allocation,
  currentBalances,
  emergencyTarget,
  onClose,
  onConfirm,
}: Props) {
  const efComplete = currentBalances.emergency >= emergencyTarget;

  // Compute what each fund will receive, applying the redirect rule.
  const emergencyAdd = efComplete
    ? 0
    : Math.min(emergencyTarget - currentBalances.emergency, allocation.emergency);
  const investmentAdd = efComplete
    ? allocation.investment + allocation.emergency
    : allocation.investment;
  const techAdd = allocation.tech;

  const rows = [
    {
      key: 'emergency',
      label: 'Emergency Fund',
      sub: efComplete
        ? 'Target reached · redirected to Investment'
        : 'Continues building safety net',
      delta: emergencyAdd,
      color: colors.fund.emergency,
      icon: 'shield-outline' as const,
      muted: efComplete,
    },
    {
      key: 'investment',
      label: 'Investment',
      sub: efComplete
        ? 'Receives emergency redirect + monthly SIP'
        : 'Monthly SIP contribution',
      delta: investmentAdd,
      color: colors.fund.investment,
      icon: 'trending-up-outline' as const,
    },
    {
      key: 'tech',
      label: 'Tech goals',
      sub: 'Toward iPhone, MacBook, etc.',
      delta: techAdd,
      color: colors.fund.tech,
      icon: 'flash-outline' as const,
    },
  ];

  const totalAdded = emergencyAdd + investmentAdd + techAdd;

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Log month {month}</Text>
        <Text style={styles.subtitle}>
          Distributing your salary into the funds below.
        </Text>

        <View style={styles.rows}>
          {rows.map((r) => (
            <View key={r.key} style={styles.row}>
              <View style={[styles.iconBadge, { backgroundColor: `${r.color}33` }]}>
                <Ionicons name={r.icon} size={18} color={r.color} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{r.label}</Text>
                <Text style={styles.rowSub}>{r.sub}</Text>
              </View>
              <Text
                style={[
                  styles.rowDelta,
                  r.muted && styles.rowDeltaMuted,
                ]}>
                {r.muted ? '—' : `+₨ ${formatGrouped(r.delta)}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Added to net worth</Text>
          <Text style={styles.summaryValue}>+₨ {formatGrouped(totalAdded)}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  rows: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  rowSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  rowDelta: {
    ...typography.heading,
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  rowDeltaMuted: {
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    marginTop: spacing.xl,
  },
  summaryLabel: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.title,
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancel: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  cancelText: {
    ...typography.heading,
    color: colors.text.primary,
  },
  confirm: {
    flex: 1.4,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    opacity: 0.85,
  },
  confirmText: {
    ...typography.heading,
    color: colors.bg.base,
  },
});
