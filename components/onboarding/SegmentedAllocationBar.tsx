import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';

type Props = {
  width: number;
  d1: SharedValue<number>;
  d2: SharedValue<number>;
  d3: SharedValue<number>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export const MIN_FRACTION = 0.02;
const HANDLE_HIT = 40;
const HANDLE_VISUAL = 4;
const BAR_HEIGHT = 28;

export const SEG_COLORS = {
  expenses: '#3A3A45',
  emergency: colors.fund.emergency,
  investment: colors.fund.investment,
  tech: colors.fund.tech,
};

export function SegmentedAllocationBar({ width, d1, d2, d3, onDragStart, onDragEnd }: Props) {
  const barWidth = useSharedValue(Math.max(0, width));

  const start1 = useSharedValue(0);
  const start2 = useSharedValue(0);
  const start3 = useSharedValue(0);

  useEffect(() => {
    barWidth.value = Math.max(0, width);
  }, [width, barWidth]);

  const notifyStart = () => onDragStart?.();
  const notifyEnd = () => onDragEnd?.();

  const pan1 = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .onStart(() => {
      cancelAnimation(d1);
      cancelAnimation(d2);
      cancelAnimation(d3);
      start1.value = d1.value;
      if (onDragStart) runOnJS(notifyStart)();
    })
    .onUpdate((e) => {
      const w = barWidth.value;
      if (w <= 0) return;
      const delta = e.translationX / w;
      const min = MIN_FRACTION;
      const max = d2.value - MIN_FRACTION;
      d1.value = Math.min(max, Math.max(min, start1.value + delta));
    })
    .onEnd(() => {
      if (onDragEnd) runOnJS(notifyEnd)();
    });

  const pan2 = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .onStart(() => {
      cancelAnimation(d1);
      cancelAnimation(d2);
      cancelAnimation(d3);
      start2.value = d2.value;
      if (onDragStart) runOnJS(notifyStart)();
    })
    .onUpdate((e) => {
      const w = barWidth.value;
      if (w <= 0) return;
      const delta = e.translationX / w;
      const min = d1.value + MIN_FRACTION;
      const max = d3.value - MIN_FRACTION;
      d2.value = Math.min(max, Math.max(min, start2.value + delta));
    })
    .onEnd(() => {
      if (onDragEnd) runOnJS(notifyEnd)();
    });

  const pan3 = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .onStart(() => {
      cancelAnimation(d1);
      cancelAnimation(d2);
      cancelAnimation(d3);
      start3.value = d3.value;
      if (onDragStart) runOnJS(notifyStart)();
    })
    .onUpdate((e) => {
      const w = barWidth.value;
      if (w <= 0) return;
      const delta = e.translationX / w;
      const min = d2.value + MIN_FRACTION;
      const max = 1 - MIN_FRACTION;
      d3.value = Math.min(max, Math.max(min, start3.value + delta));
    })
    .onEnd(() => {
      if (onDragEnd) runOnJS(notifyEnd)();
    });

  const expensesStyle = useAnimatedStyle(() => ({
    width: barWidth.value * d1.value,
  }));
  const emergencyStyle = useAnimatedStyle(() => ({
    width: barWidth.value * (d2.value - d1.value),
  }));
  const investmentStyle = useAnimatedStyle(() => ({
    width: barWidth.value * (d3.value - d2.value),
  }));
  const techStyle = useAnimatedStyle(() => ({
    width: barWidth.value * (1 - d3.value),
  }));

  const handle1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: barWidth.value * d1.value - HANDLE_HIT / 2 }],
  }));
  const handle2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: barWidth.value * d2.value - HANDLE_HIT / 2 }],
  }));
  const handle3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: barWidth.value * d3.value - HANDLE_HIT / 2 }],
  }));

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.bar}>
        <Animated.View style={[styles.segment, { backgroundColor: SEG_COLORS.expenses }, expensesStyle]} />
        <Animated.View style={[styles.segment, { backgroundColor: SEG_COLORS.emergency }, emergencyStyle]} />
        <Animated.View style={[styles.segment, { backgroundColor: SEG_COLORS.investment }, investmentStyle]} />
        <Animated.View style={[styles.segment, { backgroundColor: SEG_COLORS.tech }, techStyle]} />
      </View>

      <GestureDetector gesture={pan1}>
        <Animated.View style={[styles.handleHit, handle1Style]}>
          <View style={styles.handle} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={pan2}>
        <Animated.View style={[styles.handleHit, handle2Style]}>
          <View style={styles.handle} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={pan3}>
        <Animated.View style={[styles.handleHit, handle3Style]}>
          <View style={styles.handle} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HANDLE_HIT,
    justifyContent: 'center',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
  },
  segment: {
    height: BAR_HEIGHT,
  },
  handleHit: {
    position: 'absolute',
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    top: 0,
  },
  handle: {
    width: HANDLE_VISUAL,
    height: BAR_HEIGHT + 6,
    borderRadius: HANDLE_VISUAL / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
