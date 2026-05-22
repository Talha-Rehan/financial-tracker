import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { InvestmentEntry, InvestmentEntryType } from '@/types/finance';

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

function formatDayShort(iso: string): string {
  const d = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function typeLabel(type: InvestmentEntryType): string {
  if (type === 'sip') return 'SIP';
  if (type === 'lump_sum') return 'Lump sum';
  return 'Withdrawal';
}

function iconForType(type: InvestmentEntryType): React.ComponentProps<typeof Ionicons>['name'] {
  if (type === 'withdrawal') return 'arrow-up-outline';
  if (type === 'lump_sum') return 'cash-outline';
  return 'sync-outline';
}

type Props = {
  entry: InvestmentEntry;
  onRemove?: () => void;
};

export function InvestmentEntryItem({ entry, onRemove }: Props) {
  const isWithdrawal = entry.type === 'withdrawal';
  const tintColor = isWithdrawal ? colors.danger : colors.fund.investment;

  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, { backgroundColor: `${tintColor}26` }]}>
        <Ionicons name={iconForType(entry.type)} size={16} color={tintColor} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.provider} numberOfLines={1}>
          {entry.provider}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {typeLabel(entry.type)} · {formatDayShort(entry.date)}
        </Text>
        {entry.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {entry.notes}
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            isWithdrawal ? styles.amountDown : styles.amountUp,
          ]}>
          {isWithdrawal ? '−' : '+'}₨ {formatGrouped(entry.amount)}
        </Text>
        {onRemove && (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={({ pressed }) => [
              styles.removeBtn,
              pressed && styles.removeBtnPressed,
            ]}
            accessibilityLabel="Remove entry">
            <Ionicons
              name="close"
              size={14}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  provider: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notes: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  amount: {
    ...typography.subheading,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  amountUp: {
    color: colors.success,
  },
  amountDown: {
    color: colors.danger,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
