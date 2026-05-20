import { useEffect } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing, typography } from '@/constants/theme';

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
  netWorth: number;
  month: number;
  deltaThisMonth: number;
};

export function NetWorthHero({ netWorth, month, deltaThisMonth }: Props) {
  const display = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    display.value = withTiming(netWorth, {
      duration: 1400,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [netWorth, fade, display]);

  const heroProps = useAnimatedProps(() => {
    return { text: formatGrouped(display.value) } as any;
  });

  const initialText = formatGrouped(0);
  const hasMonth = month > 0;
  const monthLabel = hasMonth ? `Month ${month}` : 'Just started';
  const deltaLabel =
    deltaThisMonth > 0
      ? `↑ ₨ ${formatGrouped(deltaThisMonth)} this month`
      : deltaThisMonth < 0
      ? `↓ ₨ ${formatGrouped(Math.abs(deltaThisMonth))} this month`
      : '';

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>Net worth</Text>
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
        <Text style={styles.month}>{monthLabel}</Text>
        {deltaLabel ? (
          <>
            <Text style={styles.dot}>·</Text>
            <Text
              style={[
                styles.delta,
                deltaThisMonth > 0 && styles.deltaUp,
                deltaThisMonth < 0 && styles.deltaDown,
              ]}>
              {deltaLabel}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
  },
  month: {
    ...typography.body,
    color: colors.text.secondary,
  },
  dot: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  delta: {
    ...typography.body,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  deltaUp: {
    color: colors.success,
  },
  deltaDown: {
    color: colors.danger,
  },
});
