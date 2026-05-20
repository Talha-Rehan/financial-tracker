import { Ionicons } from "@expo/vector-icons";
import {
  Canvas,
  Circle,
  Fill,
  FractalNoise,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddTransactionSheet } from "@/components/log/AddTransactionSheet";
import { FilterSheet, LogFilters } from "@/components/log/FilterSheet";
import { TransactionItem } from "@/components/log/TransactionItem";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AddTransactionInput, useFinanceStore } from "@/store/useFinanceStore";
import { Transaction, TransactionType } from "@/types/finance";

import { ComingSoon } from "@/components/ui/ComingSoon";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthHeading(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_LONG[m - 1]} ${y}`;
}
const ALL_TYPES: TransactionType[] = [
  "salary",
  "income",
  "expense",
  "purchase",
  "transfer",
];

export default function LogTab() {
  const { width, height } = useWindowDimensions();
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [filters, setFilters] = useState<LogFilters>({
    types: new Set<TransactionType>(),
    month: null,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(monthKey(t.date));
    return [...set].sort().reverse();
  }, [transactions]);
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.types.size > 0 && !filters.types.has(t.type)) return false;
      if (filters.month && monthKey(t.date) !== filters.month) return false;
      return true;
    });
  }, [transactions, filters]);
  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const k = monthKey(t.date);
      const arr = groups.get(k) ?? [];
      arr.push(t);
      groups.set(k, arr);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, txs]) => ({
        key: k,
        heading: monthHeading(k),
        txs: txs.sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [filtered]);
  const activeFilterCount = filters.types.size + (filters.month ? 1 : 0);
  const handleClearFilters = () => {
    setFilters({ types: new Set(), month: null });
  };
  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddOpen(true);
  };
  const handleSaveTransaction = (input: AddTransactionInput) => {
    addTransaction(input);
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
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>Log</Text>
            <Text style={styles.title}>Activity</Text>
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={({ pressed }) => [
              styles.filterBtn,
              pressed && styles.filterBtnPressed,
              activeFilterCount > 0 && styles.filterBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open filters">
            <Ionicons
              name="options-outline"
              size={18}
              color={
                activeFilterCount > 0
                  ? colors.bg.base
                  : colors.text.primary
              }
            />
            <Text
              style={[
                styles.filterText,
                activeFilterCount > 0 && styles.filterTextActive,
              ]}>
              Filter
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterCount}>
                <Text style={styles.filterCountText}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {grouped.length === 0 ? (
            <EmptyState
              isFiltered={activeFilterCount > 0}
              onAdd={() => setAddOpen(true)}
              onClear={handleClearFilters}
            />
          ) : (
            grouped.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupHeading}>{group.heading}</Text>
                <View style={styles.list}>
                  {group.txs.map((tx, i) => (
                    <View key={tx.id}>
                      <TransactionItem tx={tx} />
                      {i < group.txs.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
        <AnimatedPressable
          onPress={handleFabPress}
          onPressIn={() => (fabScale.value = withTiming(0.92, { duration: 120 }))}
          onPressOut={() => (fabScale.value = withTiming(1, { duration: 180 }))}
          style={[styles.fab, fabStyle]}
          accessibilityRole="button"
          accessibilityLabel="Add transaction">
          <Ionicons name="add" size={28} color={colors.bg.base} />
        </AnimatedPressable>
      </SafeAreaView>
      <FilterSheet
      visible={filterOpen}
      filters={filters}
      monthOptions={monthOptions}
      onChange={setFilters}
      onClose={() => setFilterOpen(false)}
      onClear={handleClearFilters}
    />
    <AddTransactionSheet
      visible={addOpen}
      onClose={() => setAddOpen(false)}
      onSave={handleSaveTransaction}
    />
  </View>
);
}


function EmptyState({
  isFiltered,
  onAdd,
  onClear,
}: {
  isFiltered: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  if (isFiltered) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="funnel-outline"
          size={32}
          color={colors.text.tertiary}
        />
        <Text style={styles.emptyTitle}>No matches</Text>
        <Text style={styles.emptyText}>
          No transactions match the current filters.
        </Text>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [
            styles.emptyCta,
            pressed && styles.emptyCtaPressed,
          ]}>
          <Text style={styles.emptyCtaText}>Clear filters</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={32} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptyText}>
        Logging your salary or marking a goal as purchased will show up here.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.emptyCta,
          pressed && styles.emptyCtaPressed,
        ]}>
        <Ionicons name="add" size={18} color={colors.bg.base} />
        <Text style={styles.emptyCtaText}>Add transaction</Text>
      </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    marginBottom: spacing.xs,
  },
  filterBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  filterBtnActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  filterText: {
    ...typography.subheading,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  filterTextActive: {
    color: colors.bg.base,
    fontWeight: '600',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(8, 8, 10, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    ...typography.caption,
    color: colors.bg.base,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
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
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptyCtaPressed: {
    opacity: 0.85,
  },
  emptyCtaText: {
    ...typography.subheading,
    color: colors.bg.base,
    fontWeight: '600',
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
