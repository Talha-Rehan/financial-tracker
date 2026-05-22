import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors, radius, spacing, typography } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  description: string;
  bullets?: string[];
  confirmLabel: string;
  fullDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmResetSheet({
  visible,
  title,
  description,
  bullets = [],
  confirmLabel,
  fullDestructive,
  onClose,
  onConfirm,
}: Props) {
  const handleConfirm = () => {
    Haptics.notificationAsync(
      fullDestructive
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    onConfirm();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconBadge,
            fullDestructive && styles.iconBadgeDestructive,
          ]}>
          <Ionicons
            name={fullDestructive ? 'warning-outline' : 'refresh-outline'}
            size={24}
            color={fullDestructive ? colors.danger : colors.text.primary}
          />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {bullets.length > 0 && (
          <View style={styles.bullets}>
            {bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

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
            style={({ pressed }) => [
              styles.confirm,
              fullDestructive && styles.confirmDestructive,
              pressed && styles.confirmPressed,
            ]}>
            <Text
              style={[
                styles.confirmText,
                fullDestructive && styles.confirmTextDestructive,
              ]}>
              {confirmLabel}
            </Text>
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
    alignItems: 'stretch',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  iconBadgeDestructive: {
    backgroundColor: 'rgba(229, 97, 95, 0.10)',
    borderColor: 'rgba(229, 97, 95, 0.30)',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  bullets: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.tertiary,
    marginTop: 8,
  },
  bulletText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
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
  confirmDestructive: {
    backgroundColor: colors.danger,
  },
  confirmPressed: {
    opacity: 0.85,
  },
  confirmText: {
    ...typography.heading,
    color: colors.bg.base,
  },
  confirmTextDestructive: {
    color: colors.text.primary,
  },
});
