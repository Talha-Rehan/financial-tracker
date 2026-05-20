import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { TransactionType } from '@/types/finance';

export type LogFilters = {
  types: Set<TransactionType>;
  month: string | null; // 'YYYY-MM' or null for all
};

const TYPE_ROWS: { key: TransactionType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'salary', label: 'Salary', icon: 'wallet-outline' },
  { key: 'income', label: 'Income', icon: 'arrow-down-outline' },
  { key: 'expense', label: 'Expense', icon: 'arrow-up-outline' },
  { key: 'purchase', label: 'Purchase', icon: 'bag-handle-outline' },
  { key: 'transfer', label: 'Transfer', icon: 'swap-horizontal' },
];

type Props = {
  visible: boolean;
  filters: LogFilters;
  monthOptions: string[]; // 'YYYY-MM' strings, descending
  onChange: (next: LogFilters) => void;
  onClose: () => void;
  onClear: () => void;
};

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${y}`;
}

export function FilterSheet({
  visible,
  filters,
  monthOptions,
  onChange,
  onClose,
  onClear,
}: Props) {
  const toggleType = (k: TransactionType) => {
    const next = new Set(filters.types);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange({ ...filters, types: next });
  };

  const setMonth = (m: string | null) => {
    onChange({ ...filters, month: m });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Filters</Text>
            <Text style={styles.title}>Narrow the list</Text>
          </View>
          <Pressable
            onPress={onClear}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && styles.clearBtnPressed,
            ]}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeList}>
          {TYPE_ROWS.map((row) => {
            const checked = filters.types.has(row.key);
            return (
              <Pressable
                key={row.key}
                onPress={() => toggleType(row.key)}
                style={({ pressed }) => [
                  styles.checkRow,
                  pressed && styles.checkRowPressed,
                ]}>
                <View
                  style={[
                    styles.checkBox,
                    checked && styles.checkBoxOn,
                  ]}>
                  {checked && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.bg.base}
                    />
                  )}
                </View>
                <Ionicons
                  name={row.icon}
                  size={16}
                  color={colors.text.secondary}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={styles.checkLabel}>{row.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.spaced]}>Month</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthsRow}>
          <Pressable
            onPress={() => setMonth(null)}
            style={({ pressed }) => [
              styles.monthChip,
              filters.month === null && styles.monthChipActive,
              pressed && filters.month !== null && styles.monthChipPressed,
            ]}>
            <Text
              style={[
                styles.monthChipText,
                filters.month === null && styles.monthChipTextActive,
              ]}>
              All months
            </Text>
          </Pressable>
          {monthOptions.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMonth(m)}
              style={({ pressed }) => [
                styles.monthChip,
                filters.month === m && styles.monthChipActive,
                pressed && filters.month !== m && styles.monthChipPressed,
              ]}>
              <Text
                style={[
                  styles.monthChipText,
                  filters.month === m && styles.monthChipTextActive,
                ]}>
                {monthLabel(m)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.done, pressed && styles.donePressed]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: 2,
  },
  clearBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  clearBtnPressed: {
    opacity: 0.6,
  },
  clearText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  spaced: {
    marginTop: spacing.xl,
  },
  typeList: {
    gap: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  checkRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.30)',
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  checkLabel: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  monthsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  monthChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  monthChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  monthChipActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  monthChipText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  monthChipTextActive: {
    color: colors.bg.base,
    fontWeight: '600',
  },
  done: {
    marginTop: spacing.xxl,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePressed: {
    opacity: 0.85,
  },
  doneText: {
    ...typography.heading,
    color: colors.bg.base,
  },
});
