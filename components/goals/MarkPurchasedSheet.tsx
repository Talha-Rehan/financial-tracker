import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Goal } from '@/types/finance';

const MAX_AMOUNT = 99_999_999;

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

type Props = {
  visible: boolean;
  goal: Goal | null;
  fundBalance: number;
  onClose: () => void;
  onConfirm: (amount: number, note: string | undefined) => void;
};

export function MarkPurchasedSheet({
  visible,
  goal,
  fundBalance,
  onClose,
  onConfirm,
}: Props) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && goal) {
      setAmount(goal.targetAmount);
      setNote('');
    }
  }, [visible, goal]);

  if (!goal) {
    return <BottomSheet visible={visible} onClose={onClose}><View /></BottomSheet>;
  }

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setAmount(0);
      return;
    }
    setAmount(Math.min(MAX_AMOUNT, parseInt(digits, 10)));
  };

  const handleConfirm = () => {
    if (amount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(amount, note.trim() || undefined);
    onClose();
  };

  const focusAmount = () => amountRef.current?.focus();
  const remainingAfter = Math.max(0, fundBalance - amount);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View
            style={[styles.iconBadge, { backgroundColor: `${goal.color}33` }]}>
            <Ionicons
              name={goal.icon as any}
              size={20}
              color={goal.color}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Mark as purchased</Text>
            <Text style={styles.label}>{goal.label}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Actual amount paid</Text>
        <Pressable onPress={focusAmount} style={styles.amountRow}>
          <Text style={styles.symbol}>₨</Text>
          <Text style={styles.amount}>{formatGrouped(amount)}</Text>
          <View style={styles.caret} />
        </Pressable>
        <TextInput
          ref={amountRef}
          value={amount === 0 ? '' : amount.toString()}
          onChangeText={handleAmountChange}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={9}
          style={styles.hiddenInput}
          caretHidden
          selectTextOnFocus
        />

        <Text style={[styles.fieldLabel, styles.spaced]}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. PTA included, bought from outlet"
          placeholderTextColor={colors.text.tertiary}
          style={styles.noteField}
          maxLength={80}
          multiline
        />

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Deducting from</Text>
            <Text style={styles.summaryValue}>
              {goal.sourceFund === 'tech' ? 'Tech goals' : 'Investment'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Balance after</Text>
            <Text style={styles.summaryValueAmount}>
              ₨ {formatGrouped(remainingAfter)}
            </Text>
          </View>
        </View>

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
            onPress={handleConfirm}
            disabled={amount <= 0}
            style={({ pressed }) => [
              styles.confirm,
              amount <= 0 && styles.confirmDisabled,
              pressed && amount > 0 && styles.confirmPressed,
            ]}>
            <Text style={styles.confirmText}>Confirm purchase</Text>
          </Pressable>
        </View>
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
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  label: {
    ...typography.title,
    color: colors.text.primary,
    marginTop: 2,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  spaced: {
    marginTop: spacing.xl,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    ...typography.title,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  amount: {
    ...typography.display,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 2,
    height: 28,
    backgroundColor: colors.text.primary,
    marginLeft: 4,
    opacity: 0.5,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  noteField: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  summaryValueAmount: {
    ...typography.body,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
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
  confirm: {
    flex: 1.5,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    opacity: 0.85,
  },
  confirmDisabled: {
    opacity: 0.35,
  },
  confirmText: {
    ...typography.heading,
    color: colors.bg.base,
  },
});
