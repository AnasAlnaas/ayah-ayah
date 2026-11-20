import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { getSurah } from '@/data/quran';
import type { HeaderItem } from '@/feed/build-feed';
import { fonts, type Palette } from '@/theme';
import { ayahCountLabel, revelationLabel, type Numerals } from '@/utils/arabic';

import type { CardLayout } from './card-layout';
import { Animated, useEntrance } from './use-entrance';

type Props = {
  item: HeaderItem;
  index: number;
  active: SharedValue<number>;
  layout: CardLayout;
  palette: Palette;
  numerals: Numerals;
};

export const SurahCard = memo(function SurahCard({ item, index, active, layout, palette, numerals }: Props) {
  const entrance = useEntrance(active, index);
  const surah = getSurah(item.s);
  const meta = `${ayahCountLabel(surah.ayahs.length, numerals)}، ${revelationLabel(surah.type)}`;
  // The surah label stays readable but does not grow past the column.
  const titleSize = Math.min(38, Math.round(layout.baseFont * 1.2));
  const basmalaSize = Math.round(layout.baseFont * 0.85);

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`سورة ${surah.name}، ${meta}`}
      style={{ width: layout.width, height: layout.height, alignItems: 'center' }}>
      <View
        style={[
          styles.column,
          { width: layout.columnWidth, paddingTop: layout.padTop, paddingBottom: layout.padBottom },
        ]}>
        <Animated.View style={[styles.center, entrance]}>
          <View style={[styles.frame, { borderColor: palette.gold }]}>
            <Text style={[styles.title, { color: palette.goldDeep, fontSize: titleSize }]}>
              سُورَةُ {surah.name}
            </Text>
          </View>
          <Text style={[styles.meta, { color: palette.muted }]}>{meta}</Text>
          {surah.basmala && (
            <Text
              style={[
                styles.basmala,
                { color: palette.ink, fontSize: basmalaSize, lineHeight: Math.round(basmalaSize * 2.1) },
              ]}>
              {surah.basmala}
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  center: {
    alignItems: 'center',
  },
  frame: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  title: {
    fontFamily: fonts.quran,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  meta: {
    marginTop: 18,
    fontFamily: fonts.ui,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  basmala: {
    marginTop: 40,
    fontFamily: fonts.quran,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
