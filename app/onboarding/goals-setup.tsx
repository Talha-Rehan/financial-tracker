import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  Circle,
  Fill,
  FractalNoise,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddGoalSheet } from '@/components/onboarding/AddGoalSheet';
import { EditAmountSheet } from '@/components/onboarding/EditAmountSheet';
import { GoalCard } from '@/components/onboarding/GoalCard';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  monthlyInvestmentAllocation,
  monthlyTechAllocation,
  useFinanceStore,
} from '@/store/useFinanceStore';
import { Goal } from '@/types/finance';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GoalsSetupScreen() {
  const { width, height } = useWindowDimensions();

  const salary = useFinanceStore((s) => s.salary);
  const fractions = useFinanceStore((s) => s.fractions);
  const goals = useFinanceStore((s) => s.goals);
  const addGoal = useFinanceStore((s) => s.addGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const removeGoal = useFinanceStore((s) => s.removeGoal);
  const completeOnboarding = useFinanceStore((s) => s.completeOnboarding);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const enter = useSharedValue(0);
  const ctaScale = useSharedValue(1);
  const backScale = useSharedValue(1);
  const addScale = useSharedValue(1);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  const techAlloc = useMemo(
    () => monthlyTechAllocation(salary, fractions),
    [salary, fractions]
  );
  const investmentAlloc = useMemo(
    () => monthlyInvestmentAllocation(salary, fractions),
    [salary, fractions]
  );

  const allocFor = (fund: Goal['sourceFund']) =>
    fund === 'tech' ? techAlloc : investmentAlloc;

  const editingGoal = useMemo(
    () => goals.find((g) => g.id === editingId) ?? null,
    [goals, editingId]
  );

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) router.back();
  };

  const handleRemove = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeGoal(id);
  };

  const handleSaveAmount = (amount: number) => {
    if (!editingId) return;
    updateGoal(editingId, { targetAmount: amount });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goals.forEach((g) => removeGoal(g.id));
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ scale: backScale.value }] }));
  const addStyle = useAnimatedStyle(() => ({ transform: [{ scale: addScale.value }] }));

  const blob1 = { cx: width * 0.18, cy: height * 0.20, r: width * 0.8 };
  const blob2 = { cx: width * 0.88, cy: height * 0.78, r: width * 0.7 };

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Fill color={colors.bg.base} />
        <Circle cx={blob1.cx} cy={blob1.cy} r={blob1.r}>
          <RadialGradient
            c={vec(blob1.cx, blob1.cy)}
            r={blob1.r}
            colors={[colors.mesh.purple, colors.mesh.fade]}
          />
        </Circle>
        <Circle cx={blob2.cx} cy={blob2.cy} r={blob2.r}>
          <RadialGradient
            c={vec(blob2.cx, blob2.cy)}
            r={blob2.r}
            colors={[colors.mesh.teal, colors.mesh.fade]}
          />
        </Circle>
        <Fill opacity={0.06} blendMode="overlay">
          <FractalNoise freqX={0.85} freqY={0.85} octaves={3} />
        </Fill>
      </Canvas>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.headerRow, enterStyle]}>
          <AnimatedPressable
            hitSlop={12}
            onPress={handleBack}
            onPressIn={() => (backScale.value = withTiming(0.9, { duration: 100 }))}
            onPressOut={() => (backScale.value = withTiming(1, { duration: 160 }))}
            style={[styles.backButton, backStyle]}>
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </AnimatedPressable>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={enterStyle}>
            <Text style={styles.eyebrow}>Your first goals</Text>
            <Text style={styles.title}>What are you saving for?</Text>
            <Text style={styles.subtitle}>
              We've suggested two — confirm, edit the amounts, or add your own.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.cards, enterStyle]}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                monthlyAlloc={allocFor(goal.sourceFund)}
                onEdit={() => setEditingId(goal.id)}
                onRemove={() => handleRemove(goal.id)}
              />
            ))}

            {goals.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="flag-outline"
                  size={28}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyText}>
                  No goals yet — add one or skip and add later.
                </Text>
              </View>
            )}

            <AnimatedPressable
              onPress={() => setAdding(true)}
              onPressIn={() => (addScale.value = withTiming(0.98, { duration: 100 }))}
              onPressOut={() => (addScale.value = withTiming(1, { duration: 160 }))}
              style={[styles.addBtn, addStyle]}>
              <Ionicons name="add" size={20} color={colors.text.primary} />
              <Text style={styles.addBtnText}>Add another goal</Text>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedPressable
            style={[styles.cta, ctaStyle]}
            onPressIn={() => (ctaScale.value = withTiming(0.97, { duration: 120 }))}
            onPressOut={() => (ctaScale.value = withTiming(1, { duration: 180 }))}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue">
            <Text style={styles.ctaText}>
              {goals.length > 0 ? 'Continue' : 'Continue without goals'}
            </Text>
          </AnimatedPressable>
          {goals.length > 0 && (
            <Pressable onPress={handleSkip} hitSlop={8} style={styles.skip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <EditAmountSheet
        visible={!!editingGoal}
        goalLabel={editingGoal?.label ?? ''}
        initialAmount={editingGoal?.targetAmount ?? 0}
        onClose={() => setEditingId(null)}
        onSave={handleSaveAmount}
      />

      <AddGoalSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onAdd={addGoal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  stepBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  stepText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    color: colors.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  cards: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.glass,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderStyle: 'dashed',
  },
  addBtnText: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    ...typography.heading,
    color: colors.bg.base,
    letterSpacing: 0.2,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
