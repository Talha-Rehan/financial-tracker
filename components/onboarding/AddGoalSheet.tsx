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
  onClose: () => void;
  onAdd: (goal: Omit<Goal, 'id' | 'purchased'>) => void;
};

type Fund = 'tech' | 'investment';

export function AddGoalSheet({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [fund, setFund] = useState<Fund>('tech');

  const nameRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setAmount(0);
      setFund('tech');
      setTimeout(() => nameRef.current?.focus(), 220);
    }
  }, [visible]);

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setAmount(0);
      return;
    }
    setAmount(Math.min(MAX_AMOUNT, parseInt(digits, 10)));
  };

  const canSave = name.trim().length > 0 && amount > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd({
      label: name.trim(),
      targetAmount: amount,
      sourceFund: fund,
      icon: 'flag-outline',
      color: fund === 'tech' ? colors.fund.tech : colors.fund.investment,
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>New goal</Text>

        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          ref={nameRef}
          value={name}
          onChangeText={setName}
          placeholder="e.g. AirPods Pro"
          placeholderTextColor={colors.text.tertiary}
          style={styles.textField}
          maxLength={40}
          returnKeyType="next"
          onSubmitEditing={() => amountRef.current?.focus()}
        />

        <Text style={[styles.fieldLabel, styles.spaced]}>Target amount</Text>
        <Pressable onPress={() => amountRef.current?.focus()} style={styles.amountRow}>
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

        <Text style={[styles.fieldLabel, styles.spaced]}>Source</Text>
        <View style={styles.fundRow}>
          <FundPill
            label="Tech goals"
            color={colors.fund.tech}
            active={fund === 'tech'}
            onPress={() => setFund('tech')}
          />
          <FundPill
            label="Investment"
            color={colors.fund.investment}
            active={fund === 'investment'}
            onPress={() => setFund('investment')}
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.cta,
            !canSave && styles.ctaDisabled,
            pressed && canSave && styles.ctaPressed,
          ]}>
          <Text style={styles.ctaText}>Add goal</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function FundPill({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && { ...styles.pillActive, borderColor: color },
        pressed && !active && styles.pillPressed,
      ]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
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
    marginBottom: spacing.lg,
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
  textField: {
    ...typography.heading,
    color: colors.text.primary,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  fundRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
  },
  pillPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.xxl,
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
