import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ProgressRing } from '@/components/ui/ProgressRing';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Goal } from '@/types/finance';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

function formatPurchaseDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type Props = {
  goal: Goal;
  fundBalance: number;
  monthlyAlloc: number;
  onEdit?: () => void;
  onMarkPurchased?: () => void;
  onRemove?: () => void;
};

export function GoalListCard({
  goal,
  fundBalance,
  monthlyAlloc,
  onEdit,
  onMarkPurchased,
  onRemove,
}: Props) {
  const saved = Math.min(fundBalance, goal.targetAmount);
  const progress = goal.targetAmount > 0 ? saved / goal.targetAmount : 0;
  const remaining = Math.max(0, goal.targetAmount - fundBalance);
  const isReady = !goal.purchased && fundBalance >= goal.targetAmount;
  const months = monthlyAlloc > 0 ? Math.ceil(remaining / monthlyAlloc) : null;

  const pulse = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    if (isReady) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isReady, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.65,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const pct = Math.round(progress * 100);
  const purchasedDate = goal.purchaseDate
    ? formatPurchaseDate(goal.purchaseDate)
    : null;

  return (
    <View
      style={[
        styles.card,
        goal.purchased && styles.cardPurchased,
        isReady && styles.cardReady,
      ]}>
      {isReady && (
        <Animated.View
          style={[styles.pulseRing, pulseStyle, { borderColor: goal.color }]}
          pointerEvents="none"
        />
      )}

      <View style={styles.body}>
        <ProgressRing
          size={84}
          strokeWidth={6}
          progress={goal.purchased ? 1 : progress}
          color={goal.purchased ? colors.text.tertiary : goal.color}>
          {goal.purchased ? (
            <Ionicons name="checkmark" size={28} color={colors.text.secondary} />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.ringPct}>{pct}%</Text>
            </View>
          )}
        </ProgressRing>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Ionicons
              name={goal.icon as any}
              size={16}
              color={goal.purchased ? colors.text.tertiary : goal.color}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.name, goal.purchased && styles.textMuted]}
              numberOfLines={1}>
              {goal.label}
            </Text>
          </View>
          <Text style={[styles.amount, goal.purchased && styles.textMuted]}>
            ₨ {formatGrouped(goal.targetAmount)}
          </Text>
          {!goal.purchased && (
            <Text style={styles.saved}>
              ₨ {formatGrouped(Math.round(fundBalance))} saved
            </Text>
          )}
          {goal.purchased ? (
            <Text style={styles.metaMuted}>
              Purchased {purchasedDate}
            </Text>
          ) : isReady ? (
            <Text style={[styles.ready, { color: goal.color }]}>
              Ready to buy
            </Text>
          ) : months !== null ? (
            <Text style={styles.eta}>
              ~{months} {months === 1 ? 'month' : 'months'} at ₨{' '}
              {formatGrouped(monthlyAlloc)}/mo
            </Text>
          ) : (
            <Text style={styles.eta}>Set allocation to see ETA</Text>
          )}
        </View>

        {!goal.purchased && (
          <View style={styles.actions}>
            {onRemove && (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed,
                ]}
                accessibilityLabel="Remove goal">
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.text.tertiary}
                />
              </Pressable>
            )}
            {onEdit && (
              <Pressable
                onPress={onEdit}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed,
                ]}
                accessibilityLabel="Edit target amount">
                <Ionicons name="pencil" size={14} color={colors.text.primary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {isReady && onMarkPurchased && (
        <AnimatedPressable
          onPressIn={() =>
            (ctaScale.value = withTiming(0.97, { duration: 120 }))
          }
          onPressOut={() =>
            (ctaScale.value = withTiming(1, { duration: 180 }))
          }
          onPress={onMarkPurchased}
          style={[styles.cta, { backgroundColor: goal.color }, ctaStyle]}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${goal.label} as purchased`}>
          <Ionicons name="checkmark-circle" size={18} color={colors.bg.base} />
          <Text style={styles.ctaText}>Mark as purchased</Text>
        </AnimatedPressable>
      )}

      {goal.note && !goal.purchased && (
        <Text style={styles.note}>{goal.note}</Text>
      )}
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
    overflow: 'hidden',
  },
  cardReady: {
    borderColor: 'rgba(255,255,255,0.20)',
  },
  cardPurchased: {
    opacity: 0.65,
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringPct: {
    ...typography.subheading,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...typography.heading,
    color: colors.text.primary,
    flexShrink: 1,
  },
  amount: {
    ...typography.title,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    marginTop: 2,
  },
  saved: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  eta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
  },
  ready: {
    ...typography.subheading,
    marginTop: 4,
    fontWeight: '600',
  },
  metaMuted: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  textMuted: {
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  ctaText: {
    ...typography.subheading,
    color: colors.bg.base,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  note: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
