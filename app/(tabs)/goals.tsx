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
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoalListCard } from '@/components/goals/GoalListCard';
import { MarkPurchasedSheet } from '@/components/goals/MarkPurchasedSheet';
import { AddGoalSheet } from '@/components/onboarding/AddGoalSheet';
import { EditAmountSheet } from '@/components/onboarding/EditAmountSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  computeAllocation,
  useFinanceStore,
} from '@/store/useFinanceStore';
import { Goal } from '@/types/finance';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterKey = 'active' | 'purchased';

export default function GoalsTab() {
  const { width, height } = useWindowDimensions();
  const [filter, setFilter] = useState<FilterKey>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const salary = useFinanceStore((s) => s.salary);
  const fractions = useFinanceStore((s) => s.fractions);
  const goals = useFinanceStore((s) => s.goals);
  const fundBalances = useFinanceStore((s) => s.fundBalances);
  const addGoal = useFinanceStore((s) => s.addGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const removeGoal = useFinanceStore((s) => s.removeGoal);
  const markGoalPurchased = useFinanceStore((s) => s.markGoalPurchased);

  const allocation = useMemo(
    () => computeAllocation(salary, fractions),
    [salary, fractions]
  );

  const monthlyAlloc = (fund: Goal['sourceFund']) =>
    fund === 'tech' ? allocation.tech : allocation.investment;

  const fundBalance = (fund: Goal['sourceFund']) => fundBalances[fund];

  const activeGoals = useMemo(() => goals.filter((g) => !g.purchased), [goals]);
  const purchasedGoals = useMemo(() => goals.filter((g) => g.purchased), [goals]);

  const visibleGoals = filter === 'active' ? activeGoals : purchasedGoals;

  const readyCount = useMemo(
    () =>
      activeGoals.filter((g) => fundBalances[g.sourceFund] >= g.targetAmount)
        .length,
    [activeGoals, fundBalances]
  );

  const editingGoal = useMemo(
    () => goals.find((g) => g.id === editingId) ?? null,
    [goals, editingId]
  );

  const purchasingGoal = useMemo(
    () => goals.find((g) => g.id === purchasingId) ?? null,
    [goals, purchasingId]
  );

  const addScale = useSharedValue(1);
  const addStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const handleFilter = (key: FilterKey) => {
    if (key === filter) return;
    Haptics.selectionAsync();
    setFilter(key);
  };

  const handleRemove = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeGoal(id);
  };

  const handleSaveAmount = (amount: number) => {
    if (!editingId) return;
    updateGoal(editingId, { targetAmount: amount });
  };

  const handleConfirmPurchase = (amount: number, note?: string) => {
    if (!purchasingId) return;
    markGoalPurchased(purchasingId, amount, note);
  };

  const blob1 = { cx: width * 0.82, cy: height * 0.16, r: width * 0.85 };
  const blob2 = { cx: width * 0.12, cy: height * 0.82, r: width * 0.72 };

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
        <Fill opacity={0.05} blendMode="overlay">
          <FractalNoise freqX={0.85} freqY={0.85} octaves={3} />
        </Fill>
      </Canvas>

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>
            {filter === 'active'
              ? `${activeGoals.length} active · funded from Tech & Investment`
              : `${purchasedGoals.length} purchased`}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => handleFilter('active')}
            style={[
              styles.filterChip,
              filter === 'active' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                filter === 'active' && styles.filterTextActive,
              ]}>
              Active
            </Text>
            {activeGoals.length > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  filter === 'active' && styles.filterBadgeActive,
                ]}>
                <Text
                  style={[
                    styles.filterBadgeText,
                    filter === 'active' && styles.filterBadgeTextActive,
                  ]}>
                  {activeGoals.length}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => handleFilter('purchased')}
            style={[
              styles.filterChip,
              filter === 'purchased' && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                filter === 'purchased' && styles.filterTextActive,
              ]}>
              Purchased
            </Text>
            {purchasedGoals.length > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  filter === 'purchased' && styles.filterBadgeActive,
                ]}>
                <Text
                  style={[
                    styles.filterBadgeText,
                    filter === 'purchased' && styles.filterBadgeTextActive,
                  ]}>
                  {purchasedGoals.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {filter === 'active' && readyCount > 0 && (
          <View style={styles.readyBanner}>
            <Ionicons name="sparkles" size={16} color={colors.fund.tech} />
            <Text style={styles.readyBannerText}>
              {readyCount} goal{readyCount > 1 ? 's' : ''} ready to purchase
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {visibleGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={filter === 'active' ? 'flag-outline' : 'checkmark-done-outline'}
                size={28}
                color={colors.text.tertiary}
              />
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No active goals' : 'Nothing purchased yet'}
              </Text>
              <Text style={styles.emptySub}>
                {filter === 'active'
                  ? 'Add a goal to track savings from your Tech or Investment fund.'
                  : 'When you mark a goal as purchased, it will show up here.'}
              </Text>
            </View>
          ) : (
            visibleGoals.map((goal) => (
              <GoalListCard
                key={goal.id}
                goal={goal}
                fundBalance={fundBalance(goal.sourceFund)}
                monthlyAlloc={monthlyAlloc(goal.sourceFund)}
                onEdit={
                  filter === 'active' ? () => setEditingId(goal.id) : undefined
                }
                onRemove={
                  filter === 'active' ? () => handleRemove(goal.id) : undefined
                }
                onMarkPurchased={
                  filter === 'active'
                    ? () => setPurchasingId(goal.id)
                    : undefined
                }
              />
            ))
          )}

          {filter === 'active' && (
            <AnimatedPressable
              onPress={() => setAdding(true)}
              onPressIn={() => (addScale.value = withTiming(0.98, { duration: 100 }))}
              onPressOut={() => (addScale.value = withTiming(1, { duration: 160 }))}
              style={[styles.addBtn, addStyle]}>
              <Ionicons name="add" size={20} color={colors.text.primary} />
              <Text style={styles.addBtnText}>Add goal</Text>
            </AnimatedPressable>
          )}
        </ScrollView>
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

      <MarkPurchasedSheet
        visible={!!purchasingGoal}
        goal={purchasingGoal}
        fundBalance={
          purchasingGoal ? fundBalance(purchasingGoal.sourceFund) : 0
        }
        onClose={() => setPurchasingId(null)}
        onConfirm={handleConfirmPurchase}
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  filterChipActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  filterText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.bg.base,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  filterBadgeText: {
    ...typography.label,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  filterBadgeTextActive: {
    color: colors.bg.base,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  readyBannerText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    marginTop: spacing.sm,
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
});
