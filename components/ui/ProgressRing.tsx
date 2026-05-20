import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size: number;
  strokeWidth: number;
  progress: number; // 0..1
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
  duration?: number;
};

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  trackColor = 'rgba(255,255,255,0.10)',
  children,
  duration = 800,
}: Props) {
  const sv = useSharedValue(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progress));
    sv.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, sv, duration]);

  const end = useDerivedValue(() => sv.value);

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const inset = strokeWidth / 2;
    p.addOval({
      x: inset,
      y: inset,
      width: size - strokeWidth,
      height: size - strokeWidth,
    });
    return p;
  }, [size, strokeWidth]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        <Group
          origin={{ x: size / 2, y: size / 2 }}
          transform={[{ rotate: -Math.PI / 2 }]}>
          <Path
            path={path}
            color={trackColor}
            style="stroke"
            strokeWidth={strokeWidth}
          />
          <Path
            path={path}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            start={0}
            end={end}
          />
        </Group>
      </Canvas>
      {children && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: 'center', justifyContent: 'center' },
          ]}>
          {children}
        </View>
      )}
    </View>
  );
}
