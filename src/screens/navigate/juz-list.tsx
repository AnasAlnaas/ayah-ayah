import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getSurah, juzOf, quranText } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import { fonts, useTheme } from '@/theme';
import { formatNumber, type Numerals } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';

const ROW_HEIGHT = 60;

type Props = {
  position: Position;
  numerals: Numerals;
  onSelect: (position: Position) => void;
};

export function JuzList({ position, numerals, onSelect }: Props) {
  const palette = useTheme();
  const currentJuz = juzOf(position.s, position.a);
  const data = quranText().juz.map(([s, a], i) => ({ juz: i + 1, s, a }));

  return (
    <FlatList
      data={data}
      keyExtractor={(j) => String(j.juz)}
      getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
      initialScrollIndex={Math.max(0, currentJuz - 3)}
      renderItem={({ item }) => {
        const selected = item.juz === currentJuz;
        const name = getSurah(item.s).name;
        const start = `يبدأ من سورة ${name}، الآية ${formatNumber(item.a, numerals)}`;
        return (
          <Pressable
            // A juz that opens a surah starts on its header card.
            onPress={() => onSelect({ s: item.s, a: item.a === 1 ? 0 : item.a })}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`الجزء ${item.juz}، ${start}`}
            style={({ pressed }) => [
              styles.row,
              { borderColor: palette.line },
              (selected || pressed) && { backgroundColor: palette.highlight },
            ]}>
            <Text style={[styles.juz, { color: selected ? palette.goldDeep : palette.ink }]}>
              الجزء {formatNumber(item.juz, numerals)}
            </Text>
            <View style={styles.flex}>
              <Text numberOfLines={1} style={[styles.start, { color: palette.muted }]}>
                {start}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: ROW,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  juz: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    minWidth: 76,
    writingDirection: 'rtl',
  },
  flex: {
    flex: 1,
  },
  start: {
    fontFamily: fonts.ui,
    fontSize: 13,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
});
