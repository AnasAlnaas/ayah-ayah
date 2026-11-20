import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

const timing = { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

/**
 * The prototype's entrance: text fades in and rises 24 px when its card becomes
 * the current one, and fades out when it leaves. Off when the phone asks for
 * reduced motion.
 */
export function useEntrance(active: SharedValue<number>, index: number) {
  const reduceMotion = useReducedMotion();
  return useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1, transform: [{ translateY: 0 }] };
    const on = active.get() === index;
    return {
      opacity: withTiming(on ? 1 : 0, timing),
      transform: [{ translateY: withTiming(on ? 0 : 24, timing) }],
    };
  });
}

export { Animated };
