import { memo, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { getSurah, isSajda } from '@/data/quran';
import type { AyahItem } from '@/feed/build-feed';
import { fonts, type Palette } from '@/theme';
import { formatNumber, toArabicDigits, type Numerals } from '@/utils/arabic';

import { type CardLayout, FOOTER_HEIGHT } from './card-layout';
import { FittedText } from './fitted-text';
import { TafsirPanel } from './tafsir-panel';
import { useEntrance } from './use-entrance';

type Props = {
  item: AyahItem;
  index: number;
  active: SharedValue<number>;
  /** 0 = tafsir closed, 1 = open; animated */
  tafsir: SharedValue<number>;
  tafsirOpen: boolean;
  tafsirText: string | null;
  bookmarked: boolean;
  layout: CardLayout;
  fontScale: number;
  palette: Palette;
  numerals: Numerals;
  onPress: () => void;
  onLongPress: (item: AyahItem) => void;
  onToggleBookmark: (item: AyahItem) => void;
  onMoreTafsir: (item: AyahItem) => void;
};

/** Share of the card the ayah may keep while the tafsir is open. */
const OPEN_AYAH_SHARE = 0.5;
/** The ayah never shrinks below this when making room for the tafsir. */
const MIN_OPEN_SCALE = 0.6;

export const AyahCard = memo(function AyahCard({
  item,
  index,
  active,
  tafsir,
  tafsirOpen,
  tafsirText,
  bookmarked,
  layout,
  fontScale,
  palette,
  numerals,
  onPress,
  onLongPress,
  onToggleBookmark,
  onMoreTafsir,
}: Props) {
  const entrance = useEntrance(active, index);
  const [blockHeight, setBlockHeight] = useState(0);
  const surah = getSurah(item.s);
  const isLast = item.part === item.parts - 1;
  const sajda = isLast && isSajda(item.s, item.a);
  const number = formatNumber(item.a, numerals);
  // Tafsir belongs to the whole ayah, so it shows on the ayah's last card.
  const hasTafsir = isLast;

  // Where the ayah block goes when the tafsir opens: up to the top of the card,
  // scaled down if it would take more than half of it.
  const contentTop = layout.padTop;
  const contentHeight = layout.height - layout.padTop - layout.padBottom;
  const scale =
    blockHeight > 0 ? Math.max(MIN_OPEN_SCALE, Math.min(1, (contentHeight * OPEN_AYAH_SHARE) / blockHeight)) : 1;
  const openTop = contentTop - 12;
  const shiftY = blockHeight > 0 ? openTop + (scale * blockHeight) / 2 - (contentTop + contentHeight / 2) : 0;
  const panelTop = openTop + scale * blockHeight + 8;
  const panelHeight = Math.max(0, layout.height - layout.padBottom + 24 - panelTop);

  const glide = useAnimatedStyle(() => {
    if (!hasTafsir || blockHeight === 0) return { transform: [{ translateY: 0 }, { scale: 1 }] };
    const t = tafsir.get();
    return { transform: [{ translateY: shiftY * t }, { scale: 1 + (scale - 1) * t }] };
  });
  const reveal = useAnimatedStyle(() => {
    const t = tafsir.get();
    return {
      opacity: interpolate(t, [0.35, 1], [0, 1], 'clamp'),
      transform: [{ translateY: (1 - t) * 22 }],
    };
  });

  const onBlockLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (Math.abs(h - blockHeight) > 1) setBlockHeight(h);
  };

  const partNote = item.parts > 1 ? `، الجزء ${toArabicDigits(item.part + 1)} من ${toArabicDigits(item.parts)}` : '';
  const label = `${item.text}. سورة ${surah.name}، الآية ${toArabicDigits(item.a)}${partNote}${sajda ? '، موضع سجدة' : ''}${bookmarked ? '، محفوظة' : ''}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => onLongPress(item)}
      delayLongPress={380}
      accessible
      accessibilityLabel={label}
      accessibilityHint={tafsirOpen ? 'انقر لإخفاء التفسير، واضغط مطولًا للخيارات' : 'انقر لعرض التفسير، واضغط مطولًا للخيارات'}
      style={{ width: layout.width, height: layout.height, alignItems: 'center' }}>
      <View
        style={[
          styles.column,
          { width: layout.columnWidth, paddingTop: layout.padTop, paddingBottom: layout.padBottom },
        ]}>
        <Animated.View style={[styles.block, glide]} onLayout={onBlockLayout}>
          <Animated.View style={[styles.center, entrance]}>
            <FittedText
              key={layout.key}
              text={item.text}
              cacheKey={item.key}
              box={layout.textBox}
              baseFont={layout.baseFont}
              color={palette.ink}
            />
          </Animated.View>
          <View style={styles.footer}>
            {isLast ? (
              <>
                <View
                  style={[
                    styles.diamond,
                    { borderColor: palette.gold },
                    bookmarked && { backgroundColor: palette.gold },
                  ]}>
                  <Text
                    style={[
                      styles.number,
                      {
                        color: bookmarked ? palette.bg : palette.goldDeep,
                        fontSize: number.length >= 3 ? 14 : 17,
                      },
                    ]}>
                    {number}
                  </Text>
                </View>
                {sajda && <Text style={[styles.note, { color: palette.muted }]}>موضع سجدة</Text>}
              </>
            ) : (
              <Text style={[styles.note, styles.continues, { color: palette.muted }]}>يتبع ↓</Text>
            )}
          </View>
        </Animated.View>
      </View>

      {hasTafsir && blockHeight > 0 && (
        <Animated.View
          pointerEvents={tafsirOpen ? 'box-none' : 'none'}
          importantForAccessibility={tafsirOpen ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={!tafsirOpen}
          style={[styles.panel, { top: panelTop, left: layout.columnLeft + 28, width: layout.textBox.width + 4 }, reveal]}>
          {tafsirOpen || tafsirText !== null ? (
            <TafsirPanel
              text={tafsirText}
              width={layout.textBox.width + 4}
              height={panelHeight}
              fontScale={fontScale}
              bookmarked={bookmarked}
              palette={palette}
              onToggleBookmark={() => onToggleBookmark(item)}
              onMore={() => onMoreTafsir(item)}
            />
          ) : null}
        </Animated.View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  footer: {
    height: FOOTER_HEIGHT,
    alignItems: 'center',
    paddingTop: 26,
  },
  diamond: {
    width: 46,
    height: 46,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  number: {
    fontFamily: fonts.ui,
    transform: [{ rotate: '-45deg' }],
    includeFontPadding: false,
  },
  note: {
    marginTop: 14,
    fontFamily: fonts.ui,
    fontSize: 12,
  },
  continues: {
    marginTop: 8,
    fontSize: 13,
  },
  panel: {
    position: 'absolute',
  },
});
