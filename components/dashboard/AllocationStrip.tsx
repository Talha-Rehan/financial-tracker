import { StyleSheet, Text, View } from 'react-native';

import { SEG_COLORS } from '@/components/onboarding/SegmentedAllocationBar';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { MonthlyAllocation } from '@/store/useFinanceStore';

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
  salary: number;
  allocation: MonthlyAllocation;
};

const MIN_VISUAL = 0.02;

export function AllocationStrip({ salary, allocation }: Props) {
  const total = salary || 1;
  const segs = [
    { key: 'expenses', label: 'Expenses', amount: allocation.expenses, color: SEG_COLORS.expenses },
    { key: 'emergency', label: 'Emergency', amount: allocation.emergency, color: SEG_COLORS.emergency },
    { key: 'investment', label: 'Investment', amount: allocation.investment, color: SEG_COLORS.investment },
    { key: 'tech', label: 'Tech', amount: allocation.tech, color: SEG_COLORS.tech },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>This month's breakdown</Text>
        <Text style={styles.salary}>₨ {formatGrouped(salary)}/mo</Text>
      </View>

      <View style={styles.bar}>
        {segs.map((s) => {
          const ratio = Math.max(MIN_VISUAL, s.amount / total);
          return (
            <View
              key={s.key}
              style={{
                flex: ratio,
                backgroundColor: s.color,
              }}
            />
          );
        })}
      </View>

      <View style={styles.legendRow}>
        {segs.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <View style={styles.legendText}>
              <Text style={styles.legendLabel}>{s.label}</Text>
              <Text style={styles.legendAmount}>
                ₨ {formatGrouped(s.amount)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  salary: {
    ...typography.caption,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '47%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  legendAmount: {
    ...typography.subheading,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
});
