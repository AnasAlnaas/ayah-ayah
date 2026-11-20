import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookmarkIcon } from '@/components/icons';
import { fonts, type Palette } from '@/theme';
import { ROW } from '@/utils/rtl';

type Props = {
  text: string | null;
  width: number;
  height: number;
  fontScale: number;
  bookmarked: boolean;
  palette: Palette;
  onToggleBookmark: () => void;
  onMore: () => void;
};

const HEADER_HEIGHT = 40;
const MORE_HEIGHT = 34;

/** Average advance of Noto Naskh Arabic text, in em, for a rough line count. */
const CHAR_ADVANCE_EM = 0.42;

/**
 * Tafsir al-Muyassar under the ayah. It shows as many lines as fit; when the
 * tafsir is longer, "اقرأ التفسير كاملًا" opens the full text.
 */
export function TafsirPanel({ text, width, height, fontScale, bookmarked, palette, onToggleBookmark, onMore }: Props) {
  const fontSize = Math.round(16 * Math.min(Math.max(fontScale, 0.9), 1.3));
  const lineHeight = Math.round(fontSize * 1.9);
  const lines = Math.max(2, Math.floor((height - HEADER_HEIGHT - MORE_HEIGHT) / lineHeight));
  const perLine = Math.max(1, width / (CHAR_ADVANCE_EM * fontSize));
  const truncated = text !== null && Math.ceil((text.length / perLine) * 1.1) > lines;

  return (
    <View style={{ width, height }}>
      <View style={styles.ornament}>
        <View style={[styles.rule, { backgroundColor: palette.line }]} />
        <View style={[styles.gem, { borderColor: palette.gold }]} />
        <View style={[styles.rule, { backgroundColor: palette.line }]} />
      </View>
      <View style={styles.header}>
        <Text style={[styles.label, { color: palette.goldDeep }]}>التفسير الميسر</Text>
        <Pressable
          onPress={onToggleBookmark}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityState={{ selected: bookmarked }}
          accessibilityLabel={bookmarked ? 'إزالة الآية من المحفوظات' : 'حفظ الآية'}>
          <BookmarkIcon size={20} color={palette.gold} filled={bookmarked} />
        </Pressable>
      </View>
      <Text
        numberOfLines={lines}
        style={[styles.body, { color: palette.ink, fontSize, lineHeight }]}>
        {text ?? '…'}
      </Text>
      {truncated && (
        <Pressable onPress={onMore} hitSlop={8} accessibilityRole="button" style={styles.more}>
          <Text style={[styles.moreText, { color: palette.goldDeep }]}>اقرأ التفسير كاملًا ←</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
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
  header: {
    height: HEADER_HEIGHT - 14,
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
  },
  body: {
    fontFamily: fonts.ui,
    writingDirection: 'rtl',
  },
  more: {
    height: MORE_HEIGHT,
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: fonts.uiBold,
    fontSize: 14,
    writingDirection: 'rtl',
  },
});
