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
  title: string;
  subtitle?: string;
  initialValue: number;
  minValue?: number;
  onClose: () => void;
  onSave: (value: number) => void;
};

export function EditNumberSheet({
  visible,
  title,
  subtitle,
  initialValue,
  minValue = 0,
  onClose,
  onSave,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 220);
    }
  }, [visible, initialValue]);

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setValue(0);
      return;
    }
    setValue(Math.min(MAX_AMOUNT, parseInt(digits, 10)));
  };

  const canSave = value >= minValue && value > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(value);
    onClose();
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <Pressable onPress={focusInput} style={styles.amountRow}>
          <Text style={styles.symbol}>₨</Text>
          <Text style={styles.amount}>{formatGrouped(value)}</Text>
          <View style={styles.caret} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value === 0 ? '' : value.toString()}
          onChangeText={handleChange}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={9}
          style={styles.hiddenInput}
          caretHidden
          selectTextOnFocus
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
            disabled={!canSave}
            style={({ pressed }) => [
              styles.confirm,
              !canSave && styles.confirmDisabled,
              pressed && canSave && styles.confirmPressed,
            ]}>
            <Text style={styles.confirmText}>Save</Text>
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
  eyebrow: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
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
