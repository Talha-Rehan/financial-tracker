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
import { AddTransactionInput } from '@/store/useFinanceStore';
import { FundId } from '@/types/finance';

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

type TxKind = 'income' | 'expense';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: AddTransactionInput) => void;
};

const FUNDS: { key: FundId; label: string; color: string }[] = [
  { key: 'emergency', label: 'Emergency', color: colors.fund.emergency },
  { key: 'tech', label: 'Tech', color: colors.fund.tech },
  { key: 'investment', label: 'Investment', color: colors.fund.investment },
];

export function AddTransactionSheet({ visible, onClose, onSave }: Props) {
  const [type, setType] = useState<TxKind>('income');
  const [fund, setFund] = useState<FundId>('tech');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');

  const amountRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setType('income');
      setFund('tech');
      setAmount(0);
      setNote('');
      setTimeout(() => amountRef.current?.focus(), 220);
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

  const canSave = amount > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({
      type,
      fund,
      amount,
      note: note.trim(),
    });
    onClose();
  };

  const focusAmount = () => amountRef.current?.focus();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Add transaction</Text>

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.pillRow}>
          <TypePill
            label="Income"
            icon="arrow-down-outline"
            active={type === 'income'}
            color={colors.success}
            onPress={() => setType('income')}
          />
          <TypePill
            label="Expense"
            icon="arrow-up-outline"
            active={type === 'expense'}
            color={colors.danger}
            onPress={() => setType('expense')}
          />
        </View>

        <Text style={[styles.fieldLabel, styles.spaced]}>Fund</Text>
        <View style={styles.pillRow}>
          {FUNDS.map((f) => (
            <FundPill
              key={f.key}
              label={f.label}
              color={f.color}
              active={fund === f.key}
              onPress={() => setFund(f.key)}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, styles.spaced]}>Amount</Text>
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
          returnKeyType="next"
          onSubmitEditing={() => noteRef.current?.focus()}
        />

        <Text style={[styles.fieldLabel, styles.spaced]}>Note (optional)</Text>
        <TextInput
          ref={noteRef}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. OLX sale, freelance project"
          placeholderTextColor={colors.text.tertiary}
          style={styles.noteField}
          maxLength={60}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.cta,
            !canSave && styles.ctaDisabled,
            pressed && canSave && styles.ctaPressed,
          ]}>
          <Text style={styles.ctaText}>Save transaction</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function TypePill({
  label,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.08)' },
        pressed && !active && styles.pillPressed,
      ]}>
      <Ionicons
        name={icon}
        size={16}
        color={active ? color : colors.text.secondary}
      />
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
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
        active && { borderColor: color, backgroundColor: 'rgba(255,255,255,0.08)' },
        pressed && !active && styles.pillPressed,
      ]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
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
  pillRow: {
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  pillPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
