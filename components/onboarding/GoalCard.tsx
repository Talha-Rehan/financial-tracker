import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { Goal } from '@/types/finance';

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
  goal: Goal;
  monthlyAlloc: number;
  onEdit: () => void;
  onRemove?: () => void;
};

function fundLabel(fund: Goal['sourceFund']): string {
  return fund === 'tech' ? 'Tech goals' : 'Investment';
}

export function GoalCard({ goal, monthlyAlloc, onEdit, onRemove }: Props) {
  const months =
    monthlyAlloc > 0 ? Math.ceil(goal.targetAmount / monthlyAlloc) : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: `${goal.color}33` }]}>
          <Ionicons name={goal.icon as any} size={22} color={goal.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{goal.label}</Text>
          <Text style={styles.fundTag}>{fundLabel(goal.sourceFund)}</Text>
        </View>
        <View style={styles.headerActions}>
          {onRemove && (
            <Pressable
              onPress={onRemove}
              hitSlop={10}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              accessibilityLabel="Remove goal">
              <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
            </Pressable>
          )}
          <Pressable
            onPress={onEdit}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            accessibilityLabel="Edit target amount">
            <Ionicons name="pencil" size={16} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <Text style={styles.amount}>₨ {formatGrouped(goal.targetAmount)}</Text>

      <Text style={styles.eta}>
        {months === null
          ? 'Set tech allocation to see ETA'
          : months === 1
          ? `~1 month at ₨ ${formatGrouped(monthlyAlloc)}/mo`
          : `~${months} months at ₨ ${formatGrouped(monthlyAlloc)}/mo`}
      </Text>

      {goal.note && <Text style={styles.note}>{goal.note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    color: colors.text.primary,
  },
  fundTag: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  amount: {
    ...typography.display,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  eta: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  note: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
