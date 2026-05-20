import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { FundId, Transaction, TransactionType } from '@/types/finance';

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
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function fundLabel(f: FundId): string {
  if (f === 'tech') return 'Tech';
  if (f === 'investment') return 'Investment';
  return 'Emergency';
}

function fundColor(f: FundId): string {
  if (f === 'tech') return colors.fund.tech;
  if (f === 'investment') return colors.fund.investment;
  return colors.fund.emergency;
}

function iconForType(type: TransactionType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'salary':
      return 'wallet-outline';
    case 'income':
      return 'arrow-down-outline';
    case 'expense':
      return 'arrow-up-outline';
    case 'purchase':
      return 'bag-handle-outline';
    case 'transfer':
      return 'swap-horizontal';
  }
}

function isCredit(type: TransactionType): boolean {
  return type === 'income' || type === 'salary';
}

type Props = {
  tx: Transaction;
};

export function TransactionItem({ tx }: Props) {
  const credit = isCredit(tx.type);
  const color = fundColor(tx.fund);

  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, { backgroundColor: `${color}26` }]}>
        <Ionicons name={iconForType(tx.type)} size={16} color={color} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.note} numberOfLines={1}>
          {tx.note}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {fundLabel(tx.fund)} · {formatDayShort(tx.date)}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          credit ? styles.amountUp : styles.amountDown,
        ]}>
        {credit ? '+' : '−'}₨ {formatGrouped(tx.amount)}
      </Text>
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
  note: {
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
});
