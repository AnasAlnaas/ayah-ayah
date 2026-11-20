import type { Ref } from 'react';
import { type HostInstance, StyleSheet, Text, View } from 'react-native';

import { getSurah } from '@/data/quran';
import { FittedText } from '@/screens/reader/fitted-text';
import { fonts, palettes } from '@/theme';
import { toArabicDigits } from '@/utils/arabic';

export const SHARE_CARD_RATIO = 1.25; // 4:5, the shape social apps show best

/**
 * The image people share: the ayah on parchment in a gold frame, always in the
 * light palette so it looks the same wherever it is posted. The web version
 * draws the same design on a canvas (utils/share-image.web.ts).
 */
export function ShareCard({ s, a, width, ref }: { s: number; a: number; width: number; ref?: Ref<HostInstance> }) {
  const p = palettes.light;
  const height = Math.round(width * SHARE_CARD_RATIO);
  const unit = width / 360;
  const surah = getSurah(s);
  const text = surah.ayahs[a - 1];
  // Frame, title and number take about 250 units of the 450-unit height; the ayah gets the rest.
  const box = { width: Math.round(width - 72 * unit), height: Math.round(height - 250 * unit) };

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height, backgroundColor: p.bg }]}>
      <View
        style={[
          styles.frame,
          { borderColor: p.gold, margin: 14 * unit, borderRadius: 18 * unit, borderWidth: Math.max(1, 1.6 * unit) },
        ]}>
        <View style={[styles.inner, { borderColor: p.gold, margin: 5 * unit, borderRadius: 14 * unit }]}>
          <Text style={[styles.title, { color: p.goldDeep, fontSize: 19 * unit, lineHeight: 40 * unit }]}>
            سُورَةُ {surah.name}
          </Text>
          <View style={[styles.body, { marginVertical: 8 * unit }]}>
            <FittedText
              text={text}
              cacheKey={`share:${s}:${a}`}
              box={box}
              baseFont={Math.round(26 * unit)}
              color={p.ink}
              minScale={0.3}
            />
          </View>
          <View style={[styles.diamond, { borderColor: p.gold, width: 30 * unit, height: 30 * unit }]}>
            <Text style={[styles.number, { color: p.goldDeep, fontSize: (a >= 100 ? 10 : 12) * unit }]}>
              {toArabicDigits(a)}
            </Text>
          </View>
          <Text style={[styles.brand, { color: p.muted, fontSize: 11 * unit, marginTop: 10 * unit }]}>آية آية</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  frame: {
    flex: 1,
  },
  inner: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingVertical: 14,
  },
  title: {
    fontFamily: fonts.quran,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    borderWidth: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  number: {
    fontFamily: fonts.ui,
    transform: [{ rotate: '-45deg' }],
  },
  brand: {
    fontFamily: fonts.ui,
  },
});
