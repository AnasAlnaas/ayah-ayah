import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkIcon } from '@/components/icons';
import { SheetFrame } from '@/components/sheet-frame';
import { clampPosition, getSurah } from '@/data/quran';
import { tafsirFor, useTafsir } from '@/data/tafsir';
import { bookmarkKey, useAppStore, useBookmarkKeys } from '@/store/app-store';
import { fonts, useTheme, quranFont } from '@/theme';
import { formatNumber } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';

/** The full tafsir of one ayah, for when it does not fit under the ayah. */
export function TafsirSheet() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ s?: string; a?: string }>();
  const { s, a } = clampPosition(Number(params.s), Number(params.a) || 1);
  const ayah = Math.max(1, a);
  const numerals = useAppStore((st) => st.numerals);
  const fontScale = useAppStore((st) => st.fontScale);
  const bookmarked = useBookmarkKeys().has(bookmarkKey(s, ayah));
  const data = useTafsir();
  const surah = getSurah(s);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);
  const bodySize = Math.round(17 * Math.min(Math.max(fontScale, 0.9), 1.4));

  return (
    <SheetFrame onClose={close}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.chrome }]}>
          التفسير الميسر
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={() => useAppStore.getState().toggleBookmark(s, ayah)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ selected: bookmarked }}
            accessibilityLabel={bookmarked ? 'إزالة الآية من المحفوظات' : 'حفظ الآية'}>
            <BookmarkIcon size={22} color={palette.gold} filled={bookmarked} />
          </Pressable>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.close, { color: palette.muted }]}>إغلاق</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={[styles.reference, { color: palette.goldDeep }]}>
          سورة {surah.name}، الآية {formatNumber(ayah, numerals)}
        </Text>
        <Text style={[styles.ayah, { fontFamily: quranFont() }, { color: palette.ink }]}>{surah.ayahs[ayah - 1]}</Text>
        <View style={styles.ornament}>
          <View style={[styles.rule, { backgroundColor: palette.line }]} />
          <View style={[styles.gem, { borderColor: palette.gold }]} />
          <View style={[styles.rule, { backgroundColor: palette.line }]} />
        </View>
        <Text style={[styles.body, { color: palette.ink, fontSize: bodySize, lineHeight: Math.round(bodySize * 1.95) }]}>
          {data ? tafsirFor(data, s, ayah) : '…'}
        </Text>
        <Text style={[styles.source, { color: palette.muted }]}>
          التفسير الميسر، مجمع الملك فهد لطباعة المصحف الشريف (عبر مشروع تنزيل).
        </Text>
      </ScrollView>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
  },
  actions: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 18,
  },
  close: {
    fontFamily: fonts.ui,
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 22,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  reference: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    alignSelf: ALIGN_START,
  },
  ayah: {
    fontFamily: fonts.quran,
    fontSize: 24,
    lineHeight: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 8,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  gem: {
    width: 7,
    height: 7,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  body: {
    fontFamily: fonts.ui,
    writingDirection: 'rtl',
  },
  source: {
    marginTop: 22,
    fontFamily: fonts.ui,
    fontSize: 12,
    writingDirection: 'rtl',
  },
});
