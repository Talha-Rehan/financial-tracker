import { useEffect } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '@/constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function formatGrouped(n: number): string {
  'worklet';
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
  deployed: number;
  availablePool: number;
  provider: string;
  monthlyAmount: number;
  monthsContributed: number;
};

export function InvestmentHero({
  deployed,
  availablePool,
  provider,
  monthlyAmount,
  monthsContributed,
}: Props) {
  const display = useSharedValue(0);

  useEffect(() => {
    display.value = withTiming(deployed, {
      duration: 1400,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [deployed, display]);

  const heroProps = useAnimatedProps(() => {
    return { text: formatGrouped(display.value) } as any;
  });

  const initialText = formatGrouped(0);
  const formattedMonthly = formatGroupedJS(monthlyAmount);

  const monthsLabel =
    monthsContributed === 0
      ? 'No SIPs yet'
      : monthsContributed === 1
      ? '1 SIP month'
      : `${monthsContributed} SIP months`;

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>Deployed</Text>
      <View style={styles.row}>
        <Text style={styles.symbol}>₨</Text>
        <AnimatedTextInput
          editable={false}
          underlineColorAndroid="transparent"
          animatedProps={heroProps}
          defaultValue={initialText}
          style={styles.number}
        />
      </View>
      <View style={styles.captionRow}>
        <View style={[styles.providerDot, { backgroundColor: colors.fund.investment }]} />
        <Text style={styles.provider}>{provider}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.monthly}>
          ₨ {formattedMonthly}/mo
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.months}>{monthsLabel}</Text>
      </View>

      <View style={styles.poolCard}>
        <View style={styles.poolLeft}>
          <Text style={styles.poolLabel}>Available to invest</Text>
          <Text style={styles.poolHint}>From salary, waiting to deploy</Text>
        </View>
        <Text
          style={[
            styles.poolAmount,
            availablePool === 0 && styles.poolAmountEmpty,
          ]}>
          ₨ {formatGroupedJS(availablePool)}
        </Text>
      </View>
    </View>
  );
}

function formatGroupedJS(n: number): string {
  const rounded = Math.max(0, Math.round(n));
  const s = rounded.toString();
  let out = '';
  for (let i = s.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) out = ',' + out;
    out = s[i] + out;
  }
  return out;
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  symbol: {
    ...typography.display,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  number: {
    ...typography.hero,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    padding: 0,
    flex: 1,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
    }),
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  provider: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  dot: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  monthly: {
    ...typography.body,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  months: {
    ...typography.body,
    color: colors.text.secondary,
  },
  poolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  poolLeft: {
    flex: 1,
  },
  poolLabel: {
    ...typography.subheading,
    color: colors.text.primary,
    fontWeight: '500',
  },
  poolHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  poolAmount: {
    ...typography.title,
    color: colors.fund.investment,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  poolAmountEmpty: {
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});
