import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/segmented';
import { SheetFrame } from '@/components/sheet-frame';
import { globalAyahIndex, TOTAL_AYAHS } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import { useAppStore } from '@/store/app-store';
import { fonts, useTheme } from '@/theme';
import { formatNumber } from '@/utils/arabic';
import { ROW } from '@/utils/rtl';

import { BookmarkList } from './bookmark-list';
import { GoToForm } from './go-to-form';
import { JuzList } from './juz-list';
import { SurahList } from './surah-list';

type Tab = 'surahs' | 'juz' | 'bookmarks' | 'goto';
const TABS: Tab[] = ['surahs', 'juz', 'bookmarks', 'goto'];

export function NavigateSheet() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const position = useAppStore((s) => s.position);
  const numerals = useAppStore((s) => s.numerals);
  const params = useLocalSearchParams<{ tab?: string; from?: string }>();
  const [tab, setTab] = useState<Tab>(() => (TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'surahs'));
  const fromHome = params.from === 'home';

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);

  const go = useCallback(
    (target: Position) => {
      useAppStore.getState().jumpTo(target);
      close();
      // From the home screen, a choice opens the reader there.
      if (fromHome) router.push('/read');
    },
    [close, fromHome],
  );

  const openSettings = () => {
    close();
    router.push('/settings');
  };

  const percent = Math.floor((globalAyahIndex(position.s, position.a) / TOTAL_AYAHS) * 100);

  return (
    <SheetFrame onClose={close}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.chrome }]}>
          الفهرس
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={openSettings} hitSlop={8} accessibilityRole="button" style={styles.action}>
            <Text style={[styles.actionText, { color: palette.goldDeep }]}>الإعدادات</Text>
          </Pressable>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" style={styles.action}>
            <Text style={[styles.actionText, { color: palette.muted }]}>إغلاق</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <Segmented
          accessibilityLabel="طريقة التنقل"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'surahs', label: 'السور' },
            { value: 'juz', label: 'الأجزاء' },
            { value: 'bookmarks', label: 'المحفوظات' },
            { value: 'goto', label: 'انتقال' },
          ]}
        />
      </View>

      <View style={styles.body}>
        {tab === 'surahs' && <SurahList current={position.s} numerals={numerals} onSelect={go} />}
        {tab === 'juz' && <JuzList position={position} numerals={numerals} onSelect={go} />}
        {tab === 'bookmarks' && <BookmarkList numerals={numerals} onSelect={go} />}
        {tab === 'goto' && <GoToForm position={position} numerals={numerals} onGo={go} />}
      </View>

      <View style={[styles.footer, { borderColor: palette.line, paddingBottom: insets.bottom + 12 }]}>
        <Text style={[styles.footerText, { color: palette.muted }]}>
          موضعك: {formatNumber(percent, numerals)}٪ من المصحف
        </Text>
      </View>
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
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 19,
  },
  actions: {
    flexDirection: ROW,
    gap: 18,
  },
  action: {
    paddingVertical: 6,
  },
  actionText: {
    fontFamily: fonts.ui,
    fontSize: 15,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  body: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.ui,
    fontSize: 13,
    writingDirection: 'rtl',
  },
});
