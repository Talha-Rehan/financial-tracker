import {
  Canvas,
  Circle,
  Fill,
  FractalNoise,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HERO_TARGET = 130000;
const HERO_DURATION = 1800;

function formatGrouped(n: number): string {
  'worklet';
  const rounded = Math.max(0, Math.round(n));
  const s = rounded.toString();
  let out = '';
  for (let i = s.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) out = ',' + out;
    out = s[i] + out;
  }
  return out;
}

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();

  const count = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    count.value = withTiming(HERO_TARGET, {
      duration: HERO_DURATION,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    tagOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    ctaOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [count, heroOpacity, tagOpacity, ctaOpacity]);

  const heroProps = useAnimatedProps(() => {
    const formatted = formatGrouped(count.value);
    return { text: formatted } as any;
  });

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: (1 - heroOpacity.value) * 12 }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: (1 - tagOpacity.value) * 8 }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));

  const handlePressIn = () => {
    ctaScale.value = withTiming(0.97, { duration: 120 });
  };
  const handlePressOut = () => {
    ctaScale.value = withTiming(1, { duration: 180 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/onboarding/salary-setup');
  };

  // Mesh blob positions, scaled to viewport.
  const blob1 = { cx: width * 0.22, cy: height * 0.28, r: width * 0.85 };
  const blob2 = { cx: width * 0.82, cy: height * 0.78, r: width * 0.75 };

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Fill color={colors.bg.base} />

        {/* Mesh: two soft, low-saturation radial blooms */}
        <Circle cx={blob1.cx} cy={blob1.cy} r={blob1.r}>
          <RadialGradient
            c={vec(blob1.cx, blob1.cy)}
            r={blob1.r}
            colors={[colors.mesh.purple, colors.mesh.fade]}
          />
        </Circle>
        <Circle cx={blob2.cx} cy={blob2.cy} r={blob2.r}>
          <RadialGradient
            c={vec(blob2.cx, blob2.cy)}
            r={blob2.r}
            colors={[colors.mesh.teal, colors.mesh.fade]}
          />
        </Circle>

        {/* Grain: high-frequency fractal noise, blended on top */}
        <Fill opacity={0.08} blendMode="overlay">
          <FractalNoise freqX={0.85} freqY={0.85} octaves={3} />
        </Fill>

        {/* Bottom vignette for CTA legibility */}
        <Circle cx={width / 2} cy={height + width * 0.3} r={width * 0.9}>
          <RadialGradient
            c={vec(width / 2, height + width * 0.3)}
            r={width * 0.9}
            colors={['rgba(8, 8, 10, 0.85)', colors.mesh.fade]}
          />
        </Circle>
      </Canvas>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>MyPocket</Text>
        </View>

        <View style={styles.heroBlock}>
          <Animated.View style={[styles.heroRow, heroStyle]}>
            <Text style={styles.heroSymbol}>₨</Text>
            <AnimatedTextInput
              editable={false}
              underlineColorAndroid="transparent"
              animatedProps={heroProps}
              defaultValue="0"
              style={styles.heroNumber}
            />
          </Animated.View>
          <Animated.Text style={[styles.tagline, tagStyle]}>
            Your money. Your goals.
          </Animated.Text>
        </View>

        <Animated.View style={[styles.ctaWrap, ctaStyle]}>
          <AnimatedPressable
            style={styles.cta}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel="Get started">
            <Text style={styles.ctaText}>Get started</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.primary,
    opacity: 0.9,
  },
  brandText: {
    ...typography.subheading,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  heroSymbol: {
    ...typography.display,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    fontWeight: '400',
  },
  heroNumber: {
    ...typography.hero,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    minWidth: 220,
    textAlign: 'left',
    padding: 0,
    // TextInput on Android adds default vertical padding — strip it.
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
    }),
  },
  tagline: {
    ...typography.subheading,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    letterSpacing: 0.2,
  },
  ctaWrap: {
    marginBottom: spacing.lg,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ctaText: {
    ...typography.heading,
    color: colors.bg.base,
    letterSpacing: 0.2,
  },
});
