import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';

const FRACTION_ANIM = { duration: 320, easing: Easing.out(Easing.cubic) };
const MAX_AMOUNT = 99_999_999;

type SegmentKey = 'expenses' | 'emergency' | 'investment' | 'tech';
const ALL_KEYS: SegmentKey[] = ['expenses', 'emergency', 'investment', 'tech'];
const NO_LOCKS: Record<SegmentKey, boolean> = {
  expenses: false,
  emergency: false,
  investment: false,
  tech: false,
};
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
  current: Fractions,
  locked: boolean[]
): Fractions {
  const MIN = MIN_FRACTION;
  const segs = [
    current.d1,
    current.d2 - current.d1,
    current.d3 - current.d2,
    1 - current.d3,
  ];

  let lockedSum = 0;
  const unlockedIdx: number[] = [];
  let unlockedSum = 0;
  for (let i = 0; i < 4; i++) {
    if (i === segmentIdx) continue;
    if (locked[i]) {
      lockedSum += segs[i];
    } else {
      unlockedIdx.push(i);
      unlockedSum += segs[i];
    }
  }
  if (unlockedIdx.length === 0) return current;

  const maxNewF = 1 - lockedSum - unlockedIdx.length * MIN;
  const newF = Math.max(MIN, Math.min(maxNewF, newSegmentFraction));
  const target = 1 - newF - lockedSum;

  const result = [...segs];
  result[segmentIdx] = newF;

  if (unlockedSum > 0.001) {
    const scale = target / unlockedSum;
    let clampedSum = 0;
    let flexibleSum = 0;
    const clampedFlags: boolean[] = new Array(4).fill(false);
    for (const i of unlockedIdx) {
      const scaled = segs[i] * scale;
      if (scaled < MIN) {
        clampedFlags[i] = true;
        clampedSum += MIN;
      } else {
        flexibleSum += segs[i];
      }
    }
    if (clampedSum > 0 && flexibleSum > 0) {
      const remaining = Math.max(0, target - clampedSum);
      const reflexScale = remaining / flexibleSum;
      for (const i of unlockedIdx) {
        result[i] = clampedFlags[i] ? MIN : segs[i] * reflexScale;
      }
    } else {
      for (const i of unlockedIdx) {
        result[i] = segs[i] * scale;
      }
    }
  } else {
    const share = target / unlockedIdx.length;
    for (const i of unlockedIdx) {
      result[i] = share;
    }
  }

  return {
    d1: result[0],
    d2: result[0] + result[1],
    d3: result[0] + result[1] + result[2],
  };
}

type Props = {
  visible: boolean;
  salary: number;
  initialFractions: Fractions;
  onClose: () => void;
  onSave: (fractions: Fractions) => void;
};

export function EditAllocationsSheet({
  visible,
  salary,
  initialFractions,
  onClose,
  onSave,
}: Props) {
  const [barWidth, setBarWidth] = useState(0);
  const [editingCard, setEditingCard] = useState<SegmentKey | null>(null);
  const [editingText, setEditingText] = useState('');
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [stateFractions, setStateFractions] =
    useState<Fractions>(initialFractions);
  const [locks, setLocks] = useState<Record<SegmentKey, boolean>>(NO_LOCKS);

  const editInputRef = useRef<TextInput>(null);

  const salarySV = useSharedValue(salary);
  const d1 = useSharedValue(initialFractions.d1);
  const d2 = useSharedValue(initialFractions.d2);
  const d3 = useSharedValue(initialFractions.d3);
  const zero = useSharedValue(0);
  const one = useSharedValue(1);

  // Sync incoming initial values whenever the sheet opens.
  useEffect(() => {
    if (visible) {
      d1.value = initialFractions.d1;
      d2.value = initialFractions.d2;
      d3.value = initialFractions.d3;
      salarySV.value = salary;
      setStateFractions(initialFractions);
      setActivePreset(matchPreset(initialFractions));
      setLocks(NO_LOCKS);
      setEditingCard(null);
      setEditingText('');
    }
  }, [visible, initialFractions, salary, d1, d2, d3, salarySV]);

  const animateToFractions = useCallback(
    (next: Fractions) => {
      d1.value = withTiming(next.d1, FRACTION_ANIM);
      d2.value = withTiming(next.d2, FRACTION_ANIM);
      d3.value = withTiming(next.d3, FRACTION_ANIM);
    },
    [d1, d2, d3]
  );

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
    const lockedArr = ALL_KEYS.map((k) => locks[k]);
    const next = rebalanceFractions(
      SEGMENT_INDEX[editingCard],
      newF,
      currentFractions,
      lockedArr
    );
    animateToFractions(next);
    setStateFractions(next);
    setActivePreset(matchPreset(next));
    setEditingCard(null);
    setEditingText('');
  }, [editingCard, editingText, salary, locks, d1, d2, d3, animateToFractions]);

  const startCardEdit = (key: SegmentKey) => {
    if (salary <= 0) return;
    const allSiblingsLocked = ALL_KEYS.every((k) => k === key || locks[k]);
    if (allSiblingsLocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (editingCard && editingCard !== key) commitEdit();
    Haptics.selectionAsync();
    setEditingCard(key);
    setEditingText('');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const toggleLock = (key: SegmentKey) => {
    Haptics.selectionAsync();
    setLocks((l) => ({ ...l, [key]: !l[key] }));
  };

  const handleEditChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setEditingText('');
      return;
    }
    const n = Math.min(MAX_AMOUNT, parseInt(digits, 10));
    setEditingText(formatGrouped(n));
  };

  const handlePresetTap = (key: PresetKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToFractions(PRESETS[key]);
    setStateFractions(PRESETS[key]);
    setActivePreset(key);
    setLocks(NO_LOCKS);
    if (editingCard) {
      setEditingCard(null);
      setEditingText('');
    }
  };

  const handleResetTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateToFractions(PRESETS.balanced);
    setStateFractions(PRESETS.balanced);
    setActivePreset('balanced');
    setLocks(NO_LOCKS);
  };

  const handleDragEnd = () => {
    const current: Fractions = { d1: d1.value, d2: d2.value, d3: d3.value };
    setStateFractions(current);
    setActivePreset(matchPreset(current));
  };

  const handleSave = () => {
    if (editingCard) commitEdit();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({ d1: d1.value, d2: d2.value, d3: d3.value });
    onClose();
  };

  const initialTexts = useMemo(() => {
    const segs = [
      stateFractions.d1,
      stateFractions.d2 - stateFractions.d1,
      stateFractions.d3 - stateFractions.d2,
      1 - stateFractions.d3,
    ];
    const amounts = segs.map((f) => formatGrouped(Math.round(salary * f)));
    const pcts = segs.map((f) => `${Math.round(f * 100)}%`);
    return {
      expenses: { amount: amounts[0], pct: pcts[0] },
      emergency: { amount: amounts[1], pct: pcts[1] },
      investment: { amount: amounts[2], pct: pcts[2] },
      tech: { amount: amounts[3], pct: pcts[3] },
    };
  }, [salary, stateFractions]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Edit allocations</Text>
            <Text style={styles.subtitle}>
              On ₨ {formatGrouped(salary)}/mo
            </Text>
          </View>
          <Pressable onPress={handleResetTap} hitSlop={8}>
            <Text style={styles.resetLink}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.chipsWrap}>
          <PresetChips active={activePreset} onSelect={handlePresetTap} />
        </View>

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
            initialAmountText={initialTexts.expenses.amount}
            initialPctText={initialTexts.expenses.pct}
            isLocked={locks.expenses}
            onToggleLock={() => toggleLock('expenses')}
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
            initialAmountText={initialTexts.emergency.amount}
            initialPctText={initialTexts.emergency.pct}
            isLocked={locks.emergency}
            onToggleLock={() => toggleLock('emergency')}
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
            initialAmountText={initialTexts.investment.amount}
            initialPctText={initialTexts.investment.pct}
            isLocked={locks.investment}
            onToggleLock={() => toggleLock('investment')}
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
            initialAmountText={initialTexts.tech.amount}
            initialPctText={initialTexts.tech.pct}
            isLocked={locks.tech}
            onToggleLock={() => toggleLock('tech')}
            onPressEdit={() => startCardEdit('tech')}
          />
        </View>

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

        <View style={styles.actions}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              pressed && styles.cancelPressed,
            ]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.save,
              pressed && styles.savePressed,
            ]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: '90%',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtitle: {
    ...typography.title,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  resetLink: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsWrap: {
    marginBottom: spacing.md,
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
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  cancel: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  cancelText: {
    ...typography.heading,
    color: colors.text.primary,
  },
  save: {
    flex: 1.5,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePressed: {
    opacity: 0.85,
  },
  saveText: {
    ...typography.heading,
    color: colors.bg.base,
  },
});
