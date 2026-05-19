import { Platform } from 'react-native';

export const colors = {
  // Surfaces — deepest to lightest
  bg: {
    base: '#08080A',
    surface: '#101013',
    elevated: '#16161B',
    glass: 'rgba(255, 255, 255, 0.06)',
    glassBorder: 'rgba(255, 255, 255, 0.10)',
  },

  // Fund identity — desaturated for dark mode
  fund: {
    emergency: '#5E8BC4',
    tech: '#8278E3',
    investment: '#4FB893',
  },

  // Mesh accents (very low-saturation glows behind hero content)
  mesh: {
    purple: 'rgba(130, 120, 227, 0.22)',
    teal: 'rgba(79, 184, 147, 0.16)',
    fade: 'rgba(8, 8, 10, 0)',
  },

  // Text
  text: {
    primary: '#F4F4F6',
    secondary: '#A8A8B3',
    tertiary: '#6B6B78',
    inverse: '#08080A',
  },

  // Semantic
  success: '#4FB893',
  danger: '#E5615F',
  warning: '#D89E4C',
} as const;

export const typography = {
  hero: { fontSize: 56, fontWeight: '600' as const, lineHeight: 64, letterSpacing: -1.5 },
  display: { fontSize: 32, fontWeight: '600' as const, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  heading: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  subheading: { fontSize: 15, fontWeight: '500' as const, lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.4 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fonts = Platform.select({
  ios: { sans: 'System', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});
