import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

type Props = {
  title: string;
  children: React.ReactNode;
  footer?: string;
};

export function SettingsSection({ title, children, footer }: Props) {
  // Children render as rows; insert hairline dividers between them.
  const wrappedChildren = Array.isArray(children) ? children : [children];
  const real = wrappedChildren.filter(Boolean);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.group}>
        {real.map((child, i) => (
          <View key={i}>
            {child}
            {i < real.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  group: {
    backgroundColor: colors.bg.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.lg,
  },
  footer: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    lineHeight: 16,
  },
});
