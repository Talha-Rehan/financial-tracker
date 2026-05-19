import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedProps,
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
  label: string;
  color: string;
  salarySV: SharedValue<number>;
  startBoundary: SharedValue<number>;
  endBoundary: SharedValue<number>;
  isEditing: boolean;
  editingText: string;
  onPressEdit: () => void;
};

export function AllocationCard({
  label,
  color,
  salarySV,
  startBoundary,
  endBoundary,
  isEditing,
  editingText,
  onPressEdit,
}: Props) {
  // Initial values for defaultValue — Reanimated's animated text prop doesn't
  // always paint on first mount until a shared value next changes, so we seed
  // the TextInputs with the correct starting text.
  const initialFraction = endBoundary.value - startBoundary.value;
  const initialAmount = Math.max(0, Math.round(salarySV.value * initialFraction));
  const initialAmountText = formatGrouped(initialAmount);
  const initialPctText = `${Math.round(initialFraction * 100)}%`;

  const amountProps = useAnimatedProps(() => {
    const fraction = endBoundary.value - startBoundary.value;
    const amount = Math.max(0, Math.round(salarySV.value * fraction));
    const formatted = formatGrouped(amount);
    return { text: formatted } as any;
  });

  const pctProps = useAnimatedProps(() => {
    const fraction = endBoundary.value - startBoundary.value;
    const pct = Math.round(fraction * 100);
    return { text: `${pct}%` } as any;
  });

  return (
    <Pressable
      onPress={onPressEdit}
      style={({ pressed }) => [
        styles.card,
        isEditing && styles.cardEditing,
        pressed && !isEditing && styles.cardPressed,
      ]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountSymbol}>₨</Text>
        {isEditing ? (
          <Text style={styles.amountNumber} numberOfLines={1}>
            {editingText || '0'}
          </Text>
        ) : (
          <AnimatedTextInput
            editable={false}
            underlineColorAndroid="transparent"
            animatedProps={amountProps}
            defaultValue={initialAmountText}
            style={styles.amountNumber}
          />
        )}
      </View>

      <AnimatedTextInput
        editable={false}
        underlineColorAndroid="transparent"
        animatedProps={pctProps}
        defaultValue={initialPctText}
        style={styles.pct}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardEditing: {
    borderColor: colors.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountSymbol: {
    ...typography.body,
    color: colors.text.tertiary,
    marginRight: 4,
  },
  amountNumber: {
    ...typography.title,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    padding: 0,
    flex: 1,
    includeFontPadding: false,
  },
  pct: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    padding: 0,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
