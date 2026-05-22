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

import { AddInvestmentEntrySheet } from '@/components/investments/AddInvestmentEntrySheet';
import { InvestmentEntryItem } from '@/components/investments/InvestmentEntryItem';
import { InvestmentHero } from '@/components/investments/InvestmentHero';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  AddInvestmentEntryInput,
  computeAllocation,
  investmentTotal,
  primaryProvider,
  recentProviders,
  useFinanceStore,
} from '@/store/useFinanceStore';
import { InvestmentEntry } from '@/types/finance';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthHeading(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_LONG[m - 1]} ${y}`;
}

export default function InvestmentsTab() {
  const { width, height } = useWindowDimensions();

  const salary = useFinanceStore((s) => s.salary);
  const fractions = useFinanceStore((s) => s.fractions);
  const entries = useFinanceStore((s) => s.investmentEntries);
  const addInvestmentEntry = useFinanceStore((s) => s.addInvestmentEntry);
  const removeInvestmentEntry = useFinanceStore((s) => s.removeInvestmentEntry);

  const [addOpen, setAddOpen] = useState(false);

  const allocation = useMemo(
    () => computeAllocation(salary, fractions),
    [salary, fractions]
  );

  const deployed = useMemo(() => investmentTotal(entries), [entries]);
  const provider = useMemo(() => primaryProvider(entries), [entries]);
  const recents = useMemo(() => recentProviders(entries), [entries]);
  const availablePool = useFinanceStore((s) => s.fundBalances.investment);

  const sipMonths = useMemo(() => {
    const sipKeys = new Set<string>();
    for (const e of entries) {
      if (e.type === 'sip') sipKeys.add(monthKey(e.date));
    }
    return sipKeys.size;
  }, [entries]);

  const grouped = useMemo(() => {
    const groups = new Map<string, InvestmentEntry[]>();
    for (const e of entries) {
      const k = monthKey(e.date);
      const arr = groups.get(k) ?? [];
      arr.push(e);
      groups.set(k, arr);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, es]) => ({
        key: k,
        heading: monthHeading(k),
        items: es.sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [entries]);

  const sipScale = useSharedValue(1);
  const sipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sipScale.value }],
  }));

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const canLogSip = availablePool >= allocation.investment && allocation.investment > 0;
  const sipAmount = Math.min(availablePool, allocation.investment);
  const handleLogSip = () => {
    if (!canLogSip) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addInvestmentEntry({
      provider,
      type: 'sip',
      amount: sipAmount,
    });
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddOpen(true);
  };

  const handleSaveEntry = (input: AddInvestmentEntryInput) => {
    addInvestmentEntry(input);
  };

  const handleRemove = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeInvestmentEntry(id);
  };

  const blob1 = { cx: width * 0.85, cy: height * 0.18, r: width * 0.85 };
  const blob2 = { cx: width * 0.1, cy: height * 0.85, r: width * 0.7 };

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <InvestmentHero
            deployed={deployed}
            availablePool={availablePool}
            provider={provider}
            monthlyAmount={allocation.investment}
            monthsContributed={sipMonths}
          />

          <View style={styles.sipBlock}>
            <AnimatedPressable
              onPress={handleLogSip}
              disabled={!canLogSip}
              onPressIn={() =>
                (sipScale.value = withTiming(0.97, { duration: 120 }))
              }
              onPressOut={() =>
                (sipScale.value = withTiming(1, { duration: 180 }))
              }
              style={[
                styles.sipCta,
                !canLogSip && styles.sipCtaDisabled,
                sipStyle,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Deploy this month's SIP from the pool">
              <Ionicons name="sync" size={18} color={colors.bg.base} />
              <Text style={styles.sipCtaText}>
                Deploy this month's SIP
              </Text>
              <Text style={styles.sipCtaSub}>
                −₨ {formatGrouped(allocation.investment)}
              </Text>
            </AnimatedPressable>
            <Text style={styles.sipHint}>
              {canLogSip
                ? `Moves ₨ ${formatGrouped(allocation.investment)} from your pool into ${provider} as a SIP. Use + for lump sums or other providers.`
                : availablePool === 0
                ? 'Pool is empty — log a month from the Home tab to add funds.'
                : `Pool has only ₨ ${formatGrouped(availablePool)} — log next month or use + to deploy a smaller amount.`}
            </Text>
          </View>

          <View style={styles.entriesSection}>
            <View style={styles.entriesHeader}>
              <Text style={styles.sectionTitle}>Portfolio entries</Text>
              <Text style={styles.entriesCount}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>

            {grouped.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="trending-up-outline"
                  size={28}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyText}>
                  Tap the button above to log this month's SIP, or use + to
                  add a lump sum.
                </Text>
              </View>
            ) : (
              grouped.map((group) => (
                <View key={group.key} style={styles.group}>
                  <Text style={styles.groupHeading}>{group.heading}</Text>
                  <View style={styles.list}>
                    {group.items.map((entry, i) => (
                      <View key={entry.id}>
                        <InvestmentEntryItem
                          entry={entry}
                          onRemove={() => handleRemove(entry.id)}
                        />
                        {i < group.items.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <AnimatedPressable
          onPress={handleFabPress}
          onPressIn={() => (fabScale.value = withTiming(0.92, { duration: 120 }))}
          onPressOut={() => (fabScale.value = withTiming(1, { duration: 180 }))}
          style={[styles.fab, fabStyle]}
          accessibilityRole="button"
          accessibilityLabel="Add investment entry">
          <Ionicons name="add" size={28} color={colors.bg.base} />
        </AnimatedPressable>
      </SafeAreaView>

      <AddInvestmentEntrySheet
        visible={addOpen}
        recents={recents}
        defaultAmount={Math.min(allocation.investment, availablePool)}
        availablePool={availablePool}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveEntry}
      />
    </View>
  );
}

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sipBlock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sipCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  sipCtaDisabled: {
    opacity: 0.4,
  },
  sipCtaText: {
    ...typography.heading,
    color: colors.bg.base,
    letterSpacing: 0.2,
  },
  sipCtaSub: {
    ...typography.subheading,
    color: colors.bg.base,
    opacity: 0.6,
    marginLeft: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  sipHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  entriesSection: {
    paddingHorizontal: spacing.xl,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  entriesCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupHeading: {
    ...typography.subheading,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
