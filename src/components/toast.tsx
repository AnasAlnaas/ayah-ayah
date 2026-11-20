import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { fonts, type Palette } from '@/theme';

/** Short confirmations ("نُسخت الآية") that fade away on their own. */
export function useToast() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage({ text, id: Date.now() });
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { message, show };
}

export function Toast({ message, bottom, palette }: { message: { text: string; id: number } | null; bottom: number; palette: Palette }) {
  if (!message) return null;
  return (
    <Animated.View
      key={message.id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { bottom, backgroundColor: palette.ink }]}>
      <Text style={[styles.text, { color: palette.bg }]}>{message.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  text: {
    fontFamily: fonts.ui,
    fontSize: 14,
  },
});
