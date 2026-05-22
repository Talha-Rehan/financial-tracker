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
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
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
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { FundBalances, FundId } from '@/types/finance';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MAX_AMOUNT = 99_999_999;

type FundCardConfig = {
  id: FundId;
  label: string;
  description: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const FUND_CARDS: FundCardConfig[] = [
  {
    id: 'emergency',
    label: 'Emergency Fund',
    description: 'Safety net for unexpected costs',
    color: colors.fund.emergency,
    icon: 'shield-outline',
  },
  {
    id: 'tech',
    label: 'Tech',
    description: 'Set aside for devices & gear',
    color: colors.fund.tech,
    icon: 'flash-outline',
  },
  {
    id: 'investment',
    label: 'Investment',
    description: 'Already-saved investment capital',
    color: colors.fund.investment,
    icon: 'trending-up-outline',
  },
];

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

function formatGroupedWorklet(n: number): string {
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

export default function InitialSavingsScreen() {
  const { width, height } = useWindowDimensions();

  const [balances, setBalances] = useState<FundBalances>({
    emergency: 0,
    tech: 0,
    investment: 0,
  });
  const [editingFund, setEditingFund] = useState<FundId | null>(null);
  const [editingText, setEditingText] = useState('');

  const editInputRef = useRef<TextInput>(null);

  const setInitialSavings = useFinanceStore((s) => s.setInitialSavings);

  const total = balances.emergency + balances.tech + balances.investment;
  const totalSV = useSharedValue(0);
  const enter = useSharedValue(0);
  const ctaScale = useSharedValue(1);
  const backScale = useSharedValue(1);

  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [enter]);

  useEffect(() => {
    totalSV.value = withTiming(total, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [total, totalSV]);

  const totalProps = useAnimatedProps(
    () => ({ text: formatGroupedWorklet(totalSV.value) } as any)
  );

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) router.back();
  };

  const startEdit = (fund: FundId) => {
    Haptics.selectionAsync();
    setEditingFund(fund);
    setEditingText('');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleEditChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setEditingText('');
      return;
    }
    const n = Math.min(MAX_AMOUNT, parseInt(digits, 10));
    setEditingText(formatGroupedJS(n));
  };

  const commitEdit = () => {
    if (!editingFund) return;
    const digits = editingText.replace(/[^0-9]/g, '');
    if (digits === '') {
      setEditingFund(null);
      setEditingText('');
      return;
    }
    const n = Math.min(MAX_AMOUNT, parseInt(digits, 10));
    setBalances((b) => ({ ...b, [editingFund]: n }));
    setEditingFund(null);
    setEditingText('');
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingFund) commitEdit();
    if (total > 0) {
      setInitialSavings(balances);
    }
    router.push('/onboarding/salary-setup');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingFund) {
      setEditingFund(null);
      setEditingText('');
    }
    router.push('/onboarding/salary-setup');
  };

  const blob1 = { cx: width * 0.85, cy: height * 0.22, r: width * 0.8 };
  const blob2 = { cx: width * 0.15, cy: height * 0.85, r: width * 0.7 };

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
              onPressIn={() =>
                (backScale.value = withTiming(0.9, { duration: 100 }))
              }
              onPressOut={() =>
                (backScale.value = withTiming(1, { duration: 160 }))
              }
              style={[styles.backButton, backStyle]}>
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.text.primary}
              />
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
            <Animated.View style={enterStyle}>
              <Text style={styles.eyebrow}>Your starting point</Text>
              <Text style={styles.title}>What you've already saved</Text>
              <Text style={styles.subtitle}>
                Split your existing savings across the three funds. We'll use
                this as your starting net worth.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.heroBlock, enterStyle]}>
              <Text style={styles.heroEyebrow}>Starting net worth</Text>
              <View style={styles.heroRow}>
                <Text style={styles.heroSymbol}>₨</Text>
                <AnimatedTextInput
                  editable={false}
                  underlineColorAndroid="transparent"
                  animatedProps={totalProps}
                  defaultValue={formatGroupedJS(total)}
                  style={styles.heroNumber}
                />
              </View>
            </Animated.View>

            <Animated.View style={[styles.cards, enterStyle]}>
              {FUND_CARDS.map((cfg) => (
                <FundEntryCard
                  key={cfg.id}
                  config={cfg}
                  amount={balances[cfg.id]}
                  total={total}
                  isEditing={editingFund === cfg.id}
                  editingText={editingText}
                  onPress={() => startEdit(cfg.id)}
                />
              ))}
            </Animated.View>

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
            />
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
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue">
              <Text style={styles.ctaText}>Continue</Text>
            </AnimatedPressable>
            <Pressable
              onPress={handleSkip}
              hitSlop={8}
              style={styles.skip}>
              <Text style={styles.skipText}>
                Skip — I'll start from zero
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function FundEntryCard({
  config,
  amount,
  total,
  isEditing,
  editingText,
  onPress,
}: {
  config: FundCardConfig;
  amount: number;
  total: number;
  isEditing: boolean;
  editingText: string;
  onPress: () => void;
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const display = isEditing
    ? editingText || '0'
    : formatGroupedJS(amount);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isEditing && styles.cardEditing,
        pressed && !isEditing && styles.cardPressed,
      ]}>
      <View
        style={[styles.iconBadge, { backgroundColor: `${config.color}33` }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.cardLabel}>{config.label}</Text>
        <Text style={styles.cardDescription}>{config.description}</Text>
      </View>
      <View style={styles.right}>
        <View style={styles.amountInline}>
          <Text style={styles.amountSymbol}>₨</Text>
          <Text style={styles.amountNumber} numberOfLines={1}>
            {display}
          </Text>
        </View>
        {total > 0 && (
          <Text style={styles.pct}>{pct}%</Text>
        )}
      </View>
    </Pressable>
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
  heroBlock: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
    alignItems: 'flex-start',
  },
  heroEyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroSymbol: {
    ...typography.display,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  heroNumber: {
    ...typography.hero,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    padding: 0,
    minWidth: 200,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
    }),
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  cardEditing: {
    borderColor: colors.text.primary,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  cardLabel: {
    ...typography.heading,
    color: colors.text.primary,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amountInline: {
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
  },
  pct: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
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
