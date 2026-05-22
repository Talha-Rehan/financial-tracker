import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { AddInvestmentEntryInput } from '@/store/useFinanceStore';
import { InvestmentEntryType } from '@/types/finance';

const MAX_AMOUNT = 99_999_999;
const OTHER_KEY = '__other__';

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
  recents: string[]; // ordered, primary first
  defaultAmount: number;
  availablePool: number;
  onClose: () => void;
  onSave: (input: AddInvestmentEntryInput) => void;
};

const TYPE_PILLS: { key: InvestmentEntryType; label: string }[] = [
  { key: 'sip', label: 'SIP' },
  { key: 'lump_sum', label: 'Lump sum' },
  { key: 'withdrawal', label: 'Withdrawal' },
];

export function AddInvestmentEntrySheet({
  visible,
  recents,
  defaultAmount,
  availablePool,
  onClose,
  onSave,
}: Props) {
  const [type, setType] = useState<InvestmentEntryType>('sip');
  const [providerKey, setProviderKey] = useState<string>(recents[0] ?? '');
  const [customProvider, setCustomProvider] = useState('');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const amountRef = useRef<TextInput>(null);
  const customRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setType('sip');
      setProviderKey(recents[0] ?? '');
      setCustomProvider('');
      setAmount(defaultAmount);
      setNotes('');
      setTimeout(() => amountRef.current?.focus(), 220);
    }
  }, [visible, recents, defaultAmount]);

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') {
      setAmount(0);
      return;
    }
    setAmount(Math.min(MAX_AMOUNT, parseInt(digits, 10)));
  };

  const resolvedProvider =
    providerKey === OTHER_KEY ? customProvider.trim() : providerKey;

  const deploysFromPool = type !== 'withdrawal';
  const exceedsPool = deploysFromPool && amount > availablePool;
  const canSave =
    amount > 0 && resolvedProvider.length > 0 && !exceedsPool;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave({
      type,
      provider: resolvedProvider,
      amount,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Add investment</Text>

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.pillRow}>
          {TYPE_PILLS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setType(p.key)}
              style={({ pressed }) => [
                styles.pill,
                type === p.key && styles.pillActive,
                pressed && type !== p.key && styles.pillPressed,
              ]}>
              <Text
                style={[
                  styles.pillText,
                  type === p.key && styles.pillTextActive,
                ]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.fieldLabel, styles.spaced]}>Provider</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.providersRow}>
          {recents.map((p) => (
            <Pressable
              key={p}
              onPress={() => setProviderKey(p)}
              style={({ pressed }) => [
                styles.providerChip,
                providerKey === p && styles.providerChipActive,
                pressed && providerKey !== p && styles.providerChipPressed,
              ]}>
              <Text
                style={[
                  styles.providerText,
                  providerKey === p && styles.providerTextActive,
                ]}>
                {p}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setProviderKey(OTHER_KEY);
              setTimeout(() => customRef.current?.focus(), 50);
            }}
            style={({ pressed }) => [
              styles.providerChip,
              providerKey === OTHER_KEY && styles.providerChipActive,
              pressed && providerKey !== OTHER_KEY && styles.providerChipPressed,
            ]}>
            <Ionicons
              name="add"
              size={14}
              color={
                providerKey === OTHER_KEY
                  ? colors.bg.base
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.providerText,
                providerKey === OTHER_KEY && styles.providerTextActive,
              ]}>
              Other
            </Text>
          </Pressable>
        </ScrollView>

        {providerKey === OTHER_KEY && (
          <TextInput
            ref={customRef}
            value={customProvider}
            onChangeText={setCustomProvider}
            placeholder="e.g. PSX, Meezan, HBL Asset Management"
            placeholderTextColor={colors.text.tertiary}
            style={styles.customField}
            maxLength={40}
          />
        )}

        <View style={styles.amountLabelRow}>
          <Text style={styles.fieldLabel}>Amount</Text>
          {deploysFromPool && (
            <Text
              style={[
                styles.poolHint,
                exceedsPool && styles.poolHintError,
              ]}>
              Pool: ₨ {formatGrouped(availablePool)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => amountRef.current?.focus()}
          style={styles.amountRow}>
          <Text style={styles.symbol}>₨</Text>
          <Text
            style={[styles.amount, exceedsPool && styles.amountError]}>
            {formatGrouped(amount)}
          </Text>
          <View style={styles.caret} />
        </Pressable>
        {exceedsPool && (
          <Text style={styles.errorText}>
            Exceeds the available pool by ₨{' '}
            {formatGrouped(amount - availablePool)}.
          </Text>
        )}
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

        <Text style={[styles.fieldLabel, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. NAV 81.42, KMI-30 fund"
          placeholderTextColor={colors.text.tertiary}
          style={styles.notesField}
          maxLength={80}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.cta,
            !canSave && styles.ctaDisabled,
            pressed && canSave && styles.ctaPressed,
          ]}>
          <Text style={styles.ctaText}>Save entry</Text>
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
  amountLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  poolHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  poolHintError: {
    color: colors.danger,
    fontWeight: '500',
  },
  amountError: {
    color: colors.danger,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  pillPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  pillText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: colors.bg.base,
    fontWeight: '600',
  },
  providersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
  },
  providerChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  providerChipActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  providerText: {
    ...typography.subheading,
    color: colors.text.secondary,
  },
  providerTextActive: {
    color: colors.bg.base,
    fontWeight: '600',
  },
  customField: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
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
  notesField: {
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
