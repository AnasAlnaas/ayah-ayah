import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { fonts, quranFont } from '@/theme';
import { estimateTextHeight, type TextBox } from '@/utils/split-ayah';

import { lineHeightRatio } from './card-layout';

/** Sizes already worked out, so scrolling back to an ayah shows it instantly. */
const fittedSizes = new Map<string, number>();

const STEP = 0.93;
const HARD_FLOOR = 0.45;

function firstGuess(text: string, box: TextBox, baseFont: number, minScale: number): number {
  // Start a little above the estimate: measuring only ever shrinks the text.
  for (let size = baseFont; size > baseFont * minScale; size *= 0.96) {
    if (estimateTextHeight(text, size, lineHeightRatio(size, baseFont), box.width) <= box.height) {
      return Math.min(baseFont, Math.round(size * 1.12));
    }
  }
  return Math.round(baseFont * minScale);
}

type Props = {
  text: string;
  cacheKey: string;
  box: TextBox;
  baseFont: number;
  color: string;
  /** Smallest size allowed, as a share of baseFont */
  minScale?: number;
};

/**
 * Ayah text at the largest size (up to the chosen size) that fits the box.
 * It renders hidden, measures itself, steps down until it fits, then shows.
 */
export function FittedText({ text, cacheKey, box, baseFont, color, minScale = HARD_FLOOR }: Props) {
  const key = `${cacheKey}|${box.width}x${box.height}|${baseFont}`;
  const cached = fittedSizes.get(key);
  const [size, setSize] = useState(() => cached ?? firstGuess(text, box, baseFont, minScale));
  const [ready, setReady] = useState(cached !== undefined);
  const floor = Math.round(baseFont * minScale);

  // If a measurement never arrives (same height twice in a row), show the text anyway.
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, [ready, size]);

  const onLayout = (e: LayoutChangeEvent) => {
    if (ready) return;
    const height = e.nativeEvent.layout.height;
    if (height > box.height + 1 && size > floor) {
      setSize((s) => Math.max(floor, Math.floor(s * STEP)));
    } else {
      fittedSizes.set(key, size);
      setReady(true);
    }
  };

  const ratio = lineHeightRatio(size, baseFont);
  return (
    <View style={{ width: box.width }} onLayout={onLayout}>
      <Text
        style={[
          styles.text,
          { fontFamily: quranFont() },
          { color, fontSize: size, lineHeight: Math.round(size * ratio), opacity: ready ? 1 : 0 },
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.quran,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
