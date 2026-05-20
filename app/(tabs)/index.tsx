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
  LayoutChangeEvent,
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

import { AllocationStrip } from '@/components/dashboard/AllocationStrip';
import { FundCardData, FundCarousel } from '@/components/dashboard/FundCarousel';
import { LogMonthSheet } from '@/components/dashboard/LogMonthSheet';
import { NetWorthHero } from '@/components/dashboard/NetWorthHero';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  computeAllocation,
  totalWealth,
  useFinanceStore,
} from '@/store/useFinanceStore';

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

export default function DashboardTab() {
  const { width, height } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const salary = useFinanceStore((s) => s.salary);
  const fractions = useFinanceStore((s) => s.fractions);
  const fundBalances = useFinanceStore((s) => s.fundBalances);
  const emergencyTarget = useFinanceStore((s) => s.emergencyTarget);
  const monthsLogged = useFinanceStore((s) => s.monthsLogged);
  const snapshots = useFinanceStore((s) => s.snapshots);
  const goals = useFinanceStore((s) => s.goals);
  const logMonth = useFinanceStore((s) => s.logMonth);

  const allocation = useMemo(
    () => computeAllocation(salary, fractions),
    [salary, fractions]
  );

  const netWorth = totalWealth(fundBalances);

  const deltaThisMonth = useMemo(() => {
    if (snapshots.length === 0) return 0;
    if (snapshots.length === 1) return snapshots[0].totalWealth;
    const prev = snapshots[snapshots.length - 2].totalWealth;
    const curr = snapshots[snapshots.length - 1].totalWealth;
    return curr - prev;
  }, [snapshots]);

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const isFirstMonth = monthsLogged === 0;

  const techGoals = goals.filter((g) => g.sourceFund === 'tech' && !g.purchased);
  const investmentGoals = goals.filter(
    (g) => g.sourceFund === 'investment' && !g.purchased
  );

  const nextTechGoal = useMemo(
    () =>
      techGoals.length > 0
        ? techGoals.reduce((a, b) =>
            a.targetAmount <= b.targetAmount ? a : b
          )
        : null,
    [techGoals]
  );

  const techFooter = useMemo(() => {
    if (!nextTechGoal) return 'No active goal';
    const remaining = Math.max(0, nextTechGoal.targetAmount - fundBalances.tech);
    if (remaining === 0) return `${nextTechGoal.label} · ready to buy`;
    const monthsToGo =
      allocation.tech > 0 ? Math.ceil(remaining / allocation.tech) : null;
    if (monthsToGo === null) return `Next: ${nextTechGoal.label}`;
    return `Next: ${nextTechGoal.label} · ~${monthsToGo} mo`;
  }, [nextTechGoal, fundBalances.tech, allocation.tech]);

  const emergencyFooter = useMemo(() => {
    if (fundBalances.emergency >= emergencyTarget) {
      return 'Target reached · redirecting to Investment';
    }
    const remaining = emergencyTarget - fundBalances.emergency;
    const monthsToGo =
      allocation.emergency > 0 ? Math.ceil(remaining / allocation.emergency) : null;
    if (monthsToGo === null) return 'Building safety net';
    return `~${monthsToGo} mo to target`;
  }, [fundBalances.emergency, emergencyTarget, allocation.emergency]);

  const investmentFooter = useMemo(() => {
    if (monthsLogged === 0) return 'No contributions yet';
    if (investmentGoals.length > 0) {
      return `${investmentGoals.length} active goal${investmentGoals.length > 1 ? 's' : ''}`;
    }
    return `${monthsLogged} month${monthsLogged > 1 ? 's' : ''} contributed`;
  }, [monthsLogged, investmentGoals.length]);

  const fundCards: FundCardData[] = [
    {
      id: 'emergency',
      title: 'Emergency Fund',
      subtitle: 'Safety net',
      color: colors.fund.emergency,
      icon: 'shield-outline',
      balance: fundBalances.emergency,
      target: emergencyTarget,
      footerLine: emergencyFooter,
    },
    {
      id: 'tech',
      title: 'Tech goals',
      subtitle: 'Devices & gear',
      color: colors.fund.tech,
      icon: 'flash-outline',
      balance: fundBalances.tech,
      footerLine: techFooter,
    },
    {
      id: 'investment',
      title: 'Investment',
      subtitle: 'Long-term wealth',
      color: colors.fund.investment,
      icon: 'trending-up-outline',
      balance: fundBalances.investment,
      footerLine: investmentFooter,
    },
  ];

  const handleLogTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogSheetOpen(true);
  };

  const handleConfirm = () => {
    logMonth();
  };

  const blob1 = { cx: width * 0.85, cy: height * 0.18, r: width * 0.85 };
  const blob2 = { cx: width * 0.1, cy: height * 0.85, r: width * 0.7 };

  return (
    <View
      style={styles.root}
      onLayout={(e: LayoutChangeEvent) =>
        setContainerWidth(e.nativeEvent.layout.width)
      }>
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
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>MyPocket</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <NetWorthHero
            netWorth={netWorth}
            month={monthsLogged}
            deltaThisMonth={deltaThisMonth}
          />

          {isFirstMonth && (
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Ionicons name="sparkles-outline" size={18} color={colors.text.primary} />
              </View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>First month</Text>
                <Text style={styles.bannerSub}>
                  Tap below to log your salary and start tracking your funds.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Your funds</Text>
              <Text style={styles.sectionHint}>swipe →</Text>
            </View>
            {containerWidth > 0 && (
              <FundCarousel cards={fundCards} containerWidth={containerWidth} />
            )}
          </View>

          <View style={styles.section}>
            <AllocationStrip salary={salary} allocation={allocation} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedPressable
            style={[styles.cta, ctaStyle]}
            onPressIn={() =>
              (ctaScale.value = withTiming(0.97, { duration: 120 }))
            }
            onPressOut={() =>
              (ctaScale.value = withTiming(1, { duration: 180 }))
            }
            onPress={handleLogTap}
            accessibilityRole="button"
            accessibilityLabel={`Log month ${monthsLogged + 1}`}>
            <Text style={styles.ctaText}>
              Log month {monthsLogged + 1}
            </Text>
            <Text style={styles.ctaSub}>
              +₨ {formatGrouped(allocation.emergency + allocation.investment + allocation.tech)} to net worth
            </Text>
          </AnimatedPressable>
        </View>
      </SafeAreaView>

      <LogMonthSheet
        visible={logSheetOpen}
        month={monthsLogged + 1}
        allocation={allocation}
        currentBalances={fundBalances}
        emergencyTarget={emergencyTarget}
        onClose={() => setLogSheetOpen(false)}
        onConfirm={handleConfirm}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.primary,
    opacity: 0.9,
  },
  brandText: {
    ...typography.subheading,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  bannerSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionEyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  cta: {
    height: 64,
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
  ctaSub: {
    ...typography.caption,
    color: colors.bg.base,
    opacity: 0.6,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
