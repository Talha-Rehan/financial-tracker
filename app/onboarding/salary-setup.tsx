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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

import { AllocationCard } from '@/components/onboarding/AllocationCard';
import {
  Fractions,
  matchPreset,
  PRESETS,
  PresetChips,
  PresetKey,
} from '@/components/onboarding/PresetChips';
import {
  MIN_FRACTION,
  SEG_COLORS,
  SegmentedAllocationBar,
} from '@/components/onboarding/SegmentedAllocationBar';
import { colors, radius, spacing, typography } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DEFAULT_SALARY = 130000;
const MAX_SALARY = 99_999_999;
const FRACTION_ANIM = { duration: 320, easing: Easing.out(Easing.cubic) };

type SegmentKey = 'expenses' | 'emergency' | 'investment' | 'tech';

const SEGMENT_INDEX: Record<SegmentKey, 0 | 1 | 2 | 3> = {
  expenses: 0,
  emergency: 1,
  investment: 2,
  tech: 3,
};

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

function rebalanceFractions(
  segmentIdx: 0 | 1 | 2 | 3,
  newSegmentFraction: number,
  current: Fractions
): Fractions {
  const MIN = MIN_FRACTION;
  const newF = Math.max(MIN, Math.min(1 - 3 * MIN, newSegmentFraction));

  const segs = [
    current.d1,
    current.d2 - current.d1,
    current.d3 - current.d2,
    1 - current.d3,
  ];

  const oldF = segs[segmentIdx];
  const oldOtherSum = 1 - oldF;
  const newOtherSum = 1 - newF;

  let result: number[];

  if (oldOtherSum <= 0.001) {
    result = segs.map((_, i) => (i === segmentIdx ? newF : newOtherSum / 3));
  } else {
    const scale = newOtherSum / oldOtherSum;
    result = segs.map((f, i) => (i === segmentIdx ? newF : f * scale));

    // Clamp below-MIN segments to MIN, redistribute deficit to flexible siblings.
    let clampedSum = 0;
    let flexibleSum = 0;
    const clampedFlags = result.map((f, i) => {
      if (i === segmentIdx) return false;
      if (f < MIN) {
        clampedSum += MIN;
        return true;
      }
      flexibleSum += f;
      return false;
    });

    if (clampedSum > 0 && flexibleSum > 0) {
      const remaining = newOtherSum - clampedSum;
      const reflexScale = Math.max(0, remaining) / flexibleSum;
      result = result.map((f, i) => {
        if (i === segmentIdx) return f;
        if (clampedFlags[i]) return MIN;
        return Math.max(MIN, f * reflexScale);
      });
    }
  }

  return {
    d1: result[0],
    d2: result[0] + result[1],
    d3: result[0] + result[1] + result[2],
  };
}

export default function SalarySetupScreen() {
  const { width, height } = useWindowDimensions();

  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [barWidth, setBarWidth] = useState(0);
  const [editingCard, setEditingCard] = useState<SegmentKey | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activePreset, setActivePreset] = useState<PresetKey | null>('balanced');

  const salaryInputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  // Lifted shared values (source of truth for fractions).
  const salarySV = useSharedValue(DEFAULT_SALARY);
  const d1 = useSharedValue(PRESETS.balanced.d1);
  const d2 = useSharedValue(PRESETS.balanced.d2);
  const d3 = useSharedValue(PRESETS.balanced.d3);
  const zero = useSharedValue(0);
  const one = useSharedValue(1);

  const ctaScale = useSharedValue(1);
  const backScale = useSharedValue(1);
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [enter]);

  useEffect(() => {
    salarySV.value = salary;
  }, [salary, salarySV]);

  const animateToFractions = useCallback(
    (next: Fractions) => {
      d1.value = withTiming(next.d1, FRACTION_ANIM);
      d2.value = withTiming(next.d2, FRACTION_ANIM);
      d3.value = withTiming(next.d3, FRACTION_ANIM);
    },
    [d1, d2, d3]
  );

  const handleSalaryChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setSalary(0);
      return;
    }
    const n = Math.min(MAX_SALARY, parseInt(digits, 10));
    setSalary(n);
  };

  const focusSalary = () => salaryInputRef.current?.focus();

  const commitEdit = useCallback(() => {
    if (!editingCard || salary <= 0) {
      setEditingCard(null);
      setEditingText('');
      return;
    }
    const digits = editingText.replace(/[^0-9]/g, '');
    if (digits === '') {
      setEditingCard(null);
      setEditingText('');
      return;
    }
    const newAmount = parseInt(digits, 10);
    const newF = newAmount / salary;
    const currentFractions: Fractions = {
      d1: d1.value,
      d2: d2.value,
      d3: d3.value,
    };
    const next = rebalanceFractions(
      SEGMENT_INDEX[editingCard],
      newF,
      currentFractions
    );
    animateToFractions(next);
    setActivePreset(matchPreset(next));
    setEditingCard(null);
    setEditingText('');
  }, [editingCard, editingText, salary, d1, d2, d3, animateToFractions]);

  const startCardEdit = (key: SegmentKey) => {
    if (salary <= 0) return;
    if (editingCard && editingCard !== key) {
      commitEdit();
    }
    Haptics.selectionAsync();
    setEditingCard(key);
    setEditingText('');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleEditChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setEditingText('');
      return;
    }
    const n = Math.min(MAX_SALARY, parseInt(digits, 10));
    setEditingText(formatGrouped(n));
  };

  const handlePresetTap = (key: PresetKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToFractions(PRESETS[key]);
    setActivePreset(key);
    if (editingCard) {
      setEditingCard(null);
      setEditingText('');
    }
  };

  const handleResetTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToFractions(PRESETS.balanced);
    setActivePreset('balanced');
  };

  const handleDragEnd = () => {
    const current: Fractions = { d1: d1.value, d2: d2.value, d3: d3.value };
    setActivePreset(matchPreset(current));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Next screen wired in the next step.
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) router.back();
  };

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ scale: backScale.value }] }));

  const blob1 = { cx: width * 0.85, cy: height * 0.22, r: width * 0.8 };
  const blob2 = { cx: width * 0.15, cy: height * 0.85, r: width * 0.7 };

  const continueDisabled = salary <= 0;

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
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable onPress={focusSalary}>
              <Animated.View style={enterStyle}>
                <Text style={styles.eyebrow}>Your monthly salary</Text>
                <View style={styles.salaryRow}>
                  <Text style={styles.salarySymbol}>₨</Text>
                  <Text style={styles.salaryNumber}>{formatGrouped(salary)}</Text>
                  <View style={styles.caretDot} />
                </View>
                <Text style={styles.helper}>Tap to edit · in PKR</Text>
              </Animated.View>
            </Pressable>
            <TextInput
              ref={salaryInputRef}
              value={salary === 0 ? '' : salary.toString()}
              onChangeText={handleSalaryChange}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={9}
              selectionColor={colors.text.primary}
              style={styles.hiddenInput}
              caretHidden
              selectTextOnFocus
              autoFocus={false}
            />

            <Animated.View style={[styles.breakdown, enterStyle]}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.sectionTitle}>Monthly breakdown</Text>
                <Pressable onPress={handleResetTap} hitSlop={8}>
                  <Text style={styles.resetLink}>Reset</Text>
                </Pressable>
              </View>

              <PresetChips active={activePreset} onSelect={handlePresetTap} />

              <View
                style={styles.barOuter}
                onLayout={(e: LayoutChangeEvent) =>
                  setBarWidth(e.nativeEvent.layout.width)
                }>
                {barWidth > 0 && (
                  <SegmentedAllocationBar
                    width={barWidth}
                    d1={d1}
                    d2={d2}
                    d3={d3}
                    onDragStart={() => {
                      if (editingCard) commitEdit();
                      Haptics.selectionAsync();
                    }}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </View>

              <View style={styles.cardGrid}>
                <AllocationCard
                  label="Expenses"
                  color={SEG_COLORS.expenses}
                  salarySV={salarySV}
                  startBoundary={zero}
                  endBoundary={d1}
                  isEditing={editingCard === 'expenses'}
                  editingText={editingText}
                  onPressEdit={() => startCardEdit('expenses')}
                />
                <AllocationCard
                  label="Emergency"
                  color={SEG_COLORS.emergency}
                  salarySV={salarySV}
                  startBoundary={d1}
                  endBoundary={d2}
                  isEditing={editingCard === 'emergency'}
                  editingText={editingText}
                  onPressEdit={() => startCardEdit('emergency')}
                />
                <AllocationCard
                  label="Investment"
                  color={SEG_COLORS.investment}
                  salarySV={salarySV}
                  startBoundary={d2}
                  endBoundary={d3}
                  isEditing={editingCard === 'investment'}
                  editingText={editingText}
                  onPressEdit={() => startCardEdit('investment')}
                />
                <AllocationCard
                  label="Tech goals"
                  color={SEG_COLORS.tech}
                  salarySV={salarySV}
                  startBoundary={d3}
                  endBoundary={one}
                  isEditing={editingCard === 'tech'}
                  editingText={editingText}
                  onPressEdit={() => startCardEdit('tech')}
                />
              </View>

              {editingCard && (
                <Text style={styles.editHint}>
                  Type a new PKR amount for {labelFor(editingCard)} · tap elsewhere to apply
                </Text>
              )}

              <TextInput
                ref={editInputRef}
                value={editingText}
                onChangeText={handleEditChange}
                onBlur={commitEdit}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={11}
                style={styles.hiddenInput}
                caretHidden
                autoFocus={false}
              />
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <AnimatedPressable
              disabled={continueDisabled}
              style={[styles.cta, ctaStyle, continueDisabled && styles.ctaDisabled]}
              onPressIn={() => (ctaScale.value = withTiming(0.97, { duration: 120 }))}
              onPressOut={() => (ctaScale.value = withTiming(1, { duration: 180 }))}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue">
              <Text style={styles.ctaText}>Continue</Text>
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function labelFor(key: SegmentKey): string {
  switch (key) {
    case 'expenses':
      return 'Expenses';
    case 'emergency':
      return 'Emergency';
    case 'investment':
      return 'Investment';
    case 'tech':
      return 'Tech goals';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
  },
  kav: {
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
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  salarySymbol: {
    ...typography.display,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  salaryNumber: {
    ...typography.hero,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  caretDot: {
    width: 3,
    height: 36,
    backgroundColor: colors.text.primary,
    marginLeft: 4,
    opacity: 0.5,
    borderRadius: 1,
  },
  helper: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  breakdown: {
    marginTop: spacing.xxxl,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  resetLink: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  barOuter: {
    width: '100%',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  editHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
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
  ctaDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    ...typography.heading,
    color: colors.bg.base,
    letterSpacing: 0.2,
  },
});
