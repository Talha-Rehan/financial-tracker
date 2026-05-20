import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { FundId } from '@/types/finance';

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
  width: number;
  fundId: FundId;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  balance: number;
  target?: number;
  footerLine?: string;
};

export function FundCard({
  width,
  title,
  subtitle,
  color,
  icon,
  balance,
  target,
  footerLine,
}: Props) {
  const pct = target ? Math.min(100, Math.round((balance / target) * 100)) : null;
  const targetReached = target ? balance >= target : false;

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}33` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {targetReached && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
          </View>
        )}
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amount}>₨ {formatGrouped(balance)}</Text>
        {target && (
          <Text style={styles.targetCaption}>
            of ₨ {formatGrouped(target)}
          </Text>
        )}
      </View>

      {pct !== null && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
      )}

      {footerLine && <Text style={styles.footer}>{footerLine}</Text>}
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
    minHeight: 180,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 184, 147, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    marginVertical: spacing.md,
  },
  amount: {
    ...typography.display,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  targetCaption: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPct: {
    ...typography.caption,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  footer: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
});
