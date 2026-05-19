import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

export type PresetKey = 'balanced' | 'aggressive' | 'lean';

export type Fractions = { d1: number; d2: number; d3: number };

export const PRESETS: Record<PresetKey, Fractions> = {
  balanced: { d1: 0.30, d2: 0.42, d3: 0.61 },     // 30 / 12 / 19 / 39
  aggressive: { d1: 0.20, d2: 0.35, d3: 0.60 },   // 20 / 15 / 25 / 40
  lean: { d1: 0.50, d2: 0.58, d3: 0.70 },         // 50 /  8 / 12 / 30
};

const ORDER: PresetKey[] = ['balanced', 'aggressive', 'lean'];

const LABELS: Record<PresetKey, string> = {
  balanced: 'Balanced',
  aggressive: 'Aggressive',
  lean: 'Lean',
};

type Props = {
  active: PresetKey | null;
  onSelect: (key: PresetKey) => void;
};

export function PresetChips({ active, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {ORDER.map((key) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && !isActive && styles.chipPressed,
            ]}>
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {LABELS[key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function matchPreset(fractions: Fractions, tolerance = 0.005): PresetKey | null {
  for (const key of ORDER) {
    const p = PRESETS[key];
    if (
      Math.abs(p.d1 - fractions.d1) < tolerance &&
      Math.abs(p.d2 - fractions.d2) < tolerance &&
      Math.abs(p.d3 - fractions.d3) < tolerance
    ) {
      return key;
    }
  }
  return null;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  chipActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.text.secondary,
    letterSpacing: 0.4,
  },
  chipTextActive: {
    color: colors.bg.base,
    fontWeight: '600',
  },
});
