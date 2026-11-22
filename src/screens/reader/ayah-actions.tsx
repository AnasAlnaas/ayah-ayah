import * as Clipboard from 'expo-clipboard';
import { type ReactNode, useRef, useState } from 'react';
import { type HostInstance, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookmarkIcon, CopyIcon, ShareIcon } from '@/components/icons';
import { ShareCard } from '@/components/share-card';
import { getSurah } from '@/data/quran';
import { useAppStore } from '@/store/app-store';
import { fonts, type Palette, quranFont } from '@/theme';
import { formatNumber, toArabicDigits, type Numerals } from '@/utils/arabic';
import { ROW } from '@/utils/rtl';
import { shareAyahImage } from '@/utils/share-image';

type Props = {
  target: { s: number; a: number } | null;
  palette: Palette;
  numerals: Numerals;
  bookmarked: boolean;
  onClose: () => void;
  onToast: (message: string) => void;
};

/** The copied text: the ayah in ornate brackets, then its reference. */
export function ayahCopyText(s: number, a: number): string {
  const surah = getSurah(s);
  return `﴿${surah.ayahs[a - 1]}﴾ [${surah.name}: ${toArabicDigits(a)}]`;
}

function ActionRow({ icon, label, onPress, palette }: { icon: ReactNode; label: string; onPress: () => void; palette: Palette }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.highlight }]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, { color: palette.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Long-press menu: bookmark, copy, share as image. */
export function AyahActions({ target, palette, numerals, bookmarked, onClose, onToast }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'menu' | 'share'>('menu');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HostInstance>(null);

  const close = () => {
    setMode('menu');
    onClose();
  };

  if (!target) return null;
  const surah = getSurah(target.s);
  const title = `سورة ${surah.name}، الآية ${formatNumber(target.a, numerals)}`;
  const cardWidth = Math.min(width - 64, 320);

  const toggleBookmark = () => {
    const now = useAppStore.getState().toggleBookmark(target.s, target.a);
    onToast(now ? 'حُفظت الآية في المحفوظات' : 'أُزيلت الآية من المحفوظات');
    close();
  };

  const copy = async () => {
    await Clipboard.setStringAsync(ayahCopyText(target.s, target.a));
    onToast('نُسخت الآية');
    close();
  };

  const share = async () => {
    setBusy(true);
    try {
      const result = await shareAyahImage({ cardRef, s: target.s, a: target.a, surahName: surah.name });
      if (result === 'downloaded') onToast('حُفظت الصورة في التنزيلات');
      if (result === 'unavailable') onToast('المشاركة غير متاحة على هذا الجهاز');
      close();
    } catch {
      onToast('تعذّر إنشاء الصورة');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={close} accessibilityLabel="إغلاق" />
        <Animated.View
          entering={SlideInDown.duration(260)}
          style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.line, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.grabber, { backgroundColor: palette.line }]} />
          <Text style={[styles.title, { color: palette.chrome }]}>{title}</Text>

          {mode === 'menu' ? (
            <>
              <Text numberOfLines={2} style={[styles.preview, { fontFamily: quranFont() }, { color: palette.ink }]}>
                {surah.ayahs[target.a - 1]}
              </Text>
              <View style={[styles.rows, { borderColor: palette.line }]}>
                <ActionRow
                  palette={palette}
                  icon={<BookmarkIcon color={palette.gold} filled={bookmarked} />}
                  label={bookmarked ? 'إزالة من المحفوظات' : 'حفظ الآية'}
                  onPress={toggleBookmark}
                />
                <ActionRow palette={palette} icon={<CopyIcon color={palette.gold} />} label="نسخ النص" onPress={copy} />
                <ActionRow
                  palette={palette}
                  icon={<ShareIcon color={palette.gold} />}
                  label="مشاركة كصورة"
                  onPress={() => setMode('share')}
                />
              </View>
            </>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} style={styles.shareBox}>
              <View style={[styles.cardShadow, { borderColor: palette.line }]}>
                <ShareCard ref={cardRef} s={target.s} a={target.a} width={cardWidth} />
              </View>
              <Pressable
                onPress={share}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.primary,
                  { backgroundColor: palette.goldDeep, opacity: busy ? 0.5 : pressed ? 0.85 : 1 },
                ]}>
                <Text style={[styles.primaryText, { color: palette.bg }]}>{busy ? 'جارٍ التحضير…' : 'مشاركة الصورة'}</Text>
              </Pressable>
            </Animated.View>
          )}

          <Pressable onPress={close} accessibilityRole="button" style={styles.cancel}>
            <Text style={[styles.cancelText, { color: palette.muted }]}>إلغاء</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(20, 16, 10, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  preview: {
    fontFamily: fonts.quran,
    fontSize: 20,
    lineHeight: 42,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 6,
    marginBottom: 10,
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 14,
    minHeight: 54,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: fonts.ui,
    fontSize: 16,
  },
  shareBox: {
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  cardShadow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    overflow: 'hidden',
  },
  primary: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontFamily: fonts.ui,
    fontSize: 15,
  },
});
