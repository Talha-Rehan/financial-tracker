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
  goalLabel: string;
  initialAmount: number;
  onClose: () => void;
  onSave: (amount: number) => void;
};

export function EditAmountSheet({
  visible,
  goalLabel,
  initialAmount,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState(initialAmount);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setAmount(initialAmount);
      setTimeout(() => inputRef.current?.focus(), 220);
    }
  }, [visible, initialAmount]);

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setAmount(0);
      return;
    }
    setAmount(Math.min(MAX_AMOUNT, parseInt(digits, 10)));
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(amount);
    onClose();
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Target for</Text>
        <Text style={styles.label}>{goalLabel}</Text>

        <Pressable onPress={focusInput} style={styles.amountRow}>
          <Text style={styles.symbol}>₨</Text>
          <Text style={styles.amount}>{formatGrouped(amount)}</Text>
          <View style={styles.caret} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={amount === 0 ? '' : amount.toString()}
          onChangeText={handleChange}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={9}
          style={styles.hiddenInput}
          caretHidden
          selectTextOnFocus
        />

        <Pressable
          onPress={handleDone}
          disabled={amount <= 0}
          style={({ pressed }) => [
            styles.cta,
            amount <= 0 && styles.ctaDisabled,
            pressed && amount > 0 && styles.ctaPressed,
          ]}>
          <Text style={styles.ctaText}>Done</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    marginTop: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  symbol: {
    ...typography.display,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  amount: {
    ...typography.hero,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  caret: {
    width: 3,
    height: 36,
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
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.85,
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
