import { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { fonts, type Palette } from '@/theme';

/** Mouse and trackpad users scroll down; touch users swipe up. */
function hintText(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches) {
    return 'مرّر للأسفل ↓';
  }
  return 'اسحب للأعلى ↑';
}

export function SwipeHint({ bottom, palette }: { bottom: number; palette: Palette }) {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    offset.set(
      withRepeat(withTiming(5, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [offset, reduceMotion]);

  const bounce = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { bottom }, bounce]}>
      <Text style={[styles.text, { color: palette.muted }]}>{hintText()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  text: {
    fontFamily: fonts.ui,
    fontSize: 12,
  },
});
