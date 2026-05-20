import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, radius } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const ENTER = { duration: 280, easing: Easing.out(Easing.cubic) };
const EXIT = { duration: 220, easing: Easing.in(Easing.cubic) };

export function BottomSheet({ visible, onClose, children }: Props) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  const enterY = useSharedValue(height);
  const kbOffset = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Slide-in / slide-out lifecycle.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        enterY.value = withTiming(0, ENTER);
        backdropOpacity.value = withTiming(1, ENTER);
      });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, EXIT);
      enterY.value = withTiming(height, EXIT, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible, mounted, height, enterY, backdropOpacity]);

  // Keyboard avoidance — animate sheet up by keyboard height.
  useEffect(() => {
    if (!mounted) return;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e: KeyboardEvent) => {
      const dur = Platform.OS === 'ios' && e.duration ? e.duration : 220;
      kbOffset.value = withTiming(-e.endCoordinates.height, {
        duration: dur,
        easing: Easing.out(Easing.cubic),
      });
    });
    const hideSub = Keyboard.addListener(hideEvt, (e: KeyboardEvent) => {
      const dur = Platform.OS === 'ios' && e.duration ? e.duration : 220;
      kbOffset.value = withTiming(0, {
        duration: dur,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      kbOffset.value = 0;
    };
  }, [mounted, kbOffset]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: enterY.value + kbOffset.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View style={styles.alignBottom} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.grabber} />
              {children}
            </SafeAreaView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  alignBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.elevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.bg.glassBorder,
    overflow: 'hidden',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
});
