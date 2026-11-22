import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon } from '@/components/icons';
import { getSurah } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import { type Bookmark, useAppStore } from '@/store/app-store';
import { fonts, useTheme, quranFont } from '@/theme';
import { formatNumber, type Numerals } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';

type Props = {
  numerals: Numerals;
  onSelect: (position: Position) => void;
};

export function BookmarkList({ numerals, onSelect }: Props) {
  const palette = useTheme();
  const bookmarks = useAppStore((s) => s.bookmarks);

  if (bookmarks.length === 0) {
    return (
      <View style={styles.empty}>
        <BookmarkIcon size={34} color={palette.gold} />
        <Text style={[styles.emptyTitle, { color: palette.chrome }]}>لا توجد آيات محفوظة بعد</Text>
        <Text style={[styles.emptyText, { color: palette.muted }]}>
          اضغط مطولًا على أي آية واختر «حفظ الآية»، أو استخدم علامة الحفظ بجانب التفسير.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Bookmark }) => {
    const surah = getSurah(item.s);
    const ref = `سورة ${surah.name}، الآية ${formatNumber(item.a, numerals)}`;
    return (
      <View style={[styles.row, { borderColor: palette.line }]}>
        <Pressable
          onPress={() => onSelect({ s: item.s, a: item.a })}
          accessibilityRole="button"
          accessibilityLabel={`${ref}: ${surah.ayahs[item.a - 1]}`}
          style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.ref, { color: palette.goldDeep }]}>{ref}</Text>
          <Text numberOfLines={1} style={[styles.preview, { fontFamily: quranFont() }, { color: palette.ink }]}>
            {surah.ayahs[item.a - 1]}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => useAppStore.getState().removeBookmark(item.s, item.a)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`إزالة ${ref} من المحفوظات`}
          style={styles.remove}>
          <Text style={[styles.removeText, { color: palette.muted }]}>إزالة</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={(b) => `${b.s}:${b.a}`}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    gap: 2,
  },
  ref: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  preview: {
    fontFamily: fonts.quran,
    fontSize: 19,
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  remove: {
    paddingVertical: 6,
  },
  removeText: {
    fontFamily: fonts.ui,
    fontSize: 13,
  },
});
