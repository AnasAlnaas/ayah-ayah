import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { Palette } from '@/theme';
import { physicalLeft } from '@/utils/rtl';

type Props = {
  /** 0–1 through the current surah */
  progress: number;
  visible: boolean;
  left: number;
  top: number;
  bottom: number;
  palette: Palette;
};

/** The thin gold rail on the left edge, as in the prototype. */
export function ProgressRail({ progress, visible, left, top, bottom, palette }: Props) {
  // Fill and remainder share the track by flex, which animates as a plain number.
  const fill = useAnimatedStyle(() => ({ flexGrow: withTiming(progress, { duration: 300 }) }));
  const rest = useAnimatedStyle(() => ({ flexGrow: withTiming(1 - progress, { duration: 300 }) }));
  const fade = useAnimatedStyle(() => ({ opacity: withTiming(visible ? 1 : 0, { duration: 200 }) }));

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.track, physicalLeft(left), { top, bottom, backgroundColor: palette.line }, fade]}>
      <Animated.View style={[styles.part, { backgroundColor: palette.gold }, fill]} />
      <Animated.View style={[styles.part, rest]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    width: 3,
    borderRadius: 3,
    overflow: 'hidden',
    zIndex: 5,
  },
  part: {
    flexBasis: 0,
    width: '100%',
    borderRadius: 3,
  },
});
