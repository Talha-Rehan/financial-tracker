import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

type Props = {
  label: string;
  value?: string;
  description?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  label,
  value,
  description,
  icon,
  iconColor,
  destructive,
  showChevron = true,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
      ]}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={iconColor ?? (destructive ? colors.danger : colors.text.secondary)}
          style={{ marginRight: spacing.md }}
        />
      )}
      <View style={styles.middle}>
        <Text
          style={[
            styles.label,
            destructive && { color: colors.danger },
          ]}
          numberOfLines={1}>
          {label}
        </Text>
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      {showChevron && onPress && !destructive && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.text.tertiary}
          style={{ marginLeft: spacing.sm }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  middle: {
    flex: 1,
  },
  label: {
    ...typography.subheading,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  value: {
    ...typography.body,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
});
