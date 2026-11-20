import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { quran, type Surah } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import { fonts, useTheme } from '@/theme';
import { ayahCountLabel, formatNumber, type Numerals, revelationLabel } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';

const ROW_HEIGHT = 64;

type Props = {
  current: number;
  numerals: Numerals;
  onSelect: (position: Position) => void;
};

export function SurahList({ current, numerals, onSelect }: Props) {
  const palette = useTheme();

  const renderItem = ({ item }: { item: Surah }) => {
    const selected = item.n === current;
    const meta = `${ayahCountLabel(item.ayahs.length, numerals)}، ${revelationLabel(item.type)}`;
    return (
      <Pressable
        onPress={() => onSelect({ s: item.n, a: 0 })}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${item.n}. سورة ${item.name}، ${meta}`}
        style={({ pressed }) => [
          styles.row,
          { borderColor: palette.line },
          (selected || pressed) && { backgroundColor: palette.highlight },
        ]}>
        <View style={[styles.badge, { borderColor: palette.gold }]}>
          <Text style={[styles.badgeText, { color: palette.goldDeep }]}>{formatNumber(item.n, numerals)}</Text>
        </View>
        <View style={styles.text}>
          <Text style={[styles.name, { color: selected ? palette.goldDeep : palette.ink }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: palette.muted }]}>{meta}</Text>
        </View>
        {selected && <Text style={[styles.here, { color: palette.goldDeep }]}>أنت هنا</Text>}
      </Pressable>
    );
  };

  return (
    <FlatList
      data={quran.surahs}
      keyExtractor={(s) => String(s.n)}
      renderItem={renderItem}
      getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
      initialScrollIndex={Math.max(0, current - 3)}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: ROW,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 34,
    height: 34,
    borderWidth: 1.2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  badgeText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    transform: [{ rotate: '-45deg' }],
  },
  text: {
    flex: 1,
    alignItems: 'stretch',
  },
  name: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
    writingDirection: 'rtl',
    alignSelf: ALIGN_START,
  },
  meta: {
    fontFamily: fonts.ui,
    fontSize: 12,
    writingDirection: 'rtl',
    alignSelf: ALIGN_START,
  },
  here: {
    fontFamily: fonts.ui,
    fontSize: 12,
  },
});
