import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowForwardIcon, BookmarkIcon, CompassIcon, GearIcon, LayersIcon, ListIcon } from '@/components/icons';
import { getSurah, globalAyahIndex, juzOf, totalAyahs } from '@/data/quran';
import { useAppStore } from '@/store/app-store';
import { fonts, type Palette, useTheme, quranFont } from '@/theme';
import { formatNumber } from '@/utils/arabic';
import { ayahOfTheDay } from '@/utils/ayah-of-the-day';
import { ALIGN_START, physicalLeft, ROW } from '@/utils/rtl';

import { DailyCard } from './daily-card';

type Tab = 'surahs' | 'juz' | 'bookmarks' | 'goto';

function openIndex(tab: Tab) {
  router.push({ pathname: '/navigate', params: { tab, from: 'home' } });
}

function Shortcut({ icon, label, badge, onPress, palette }: {
  icon: ReactNode;
  label: string;
  badge?: string;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}، ${badge}` : label}
      style={({ pressed }) => [
        styles.shortcut,
        { backgroundColor: pressed ? palette.highlight : palette.surface, borderColor: palette.line },
      ]}>
      {icon}
      <Text style={[styles.shortcutLabel, { color: palette.ink }]}>{label}</Text>
      {badge ? <Text style={[styles.badge, physicalLeft(14), { color: palette.goldDeep }]}>{badge}</Text> : null}
    </Pressable>
  );
}

export function Home() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const position = useAppStore((s) => s.position);
  const numerals = useAppStore((s) => s.numerals);
  const hintSeen = useAppStore((s) => s.hintSeen);
  const bookmarkCount = useAppStore((s) => s.bookmarks.length);

  const surah = getSurah(position.s);
  const fresh = !hintSeen && position.s === 1 && position.a === 0;
  const where =
    position.a === 0 ? `بداية سورة ${surah.name}` : `سورة ${surah.name}، الآية ${formatNumber(position.a, numerals)}`;
  const preview = position.a === 0 ? (surah.basmala ?? surah.ayahs[0]) : surah.ayahs[position.a - 1];
  const percent = Math.floor((globalAyahIndex(position.s, position.a) / totalAyahs()) * 100);
  const juz = juzOf(position.s, position.a);

  const daily = ayahOfTheDay();
  const dailySurah = getSurah(daily.s);

  const read = () => router.push('/read');
  const readDaily = () => {
    useAppStore.getState().jumpTo(daily);
    router.push('/read');
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.brand, { color: palette.goldDeep }]}>
            آية آية
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="الإعدادات">
            <GearIcon color={palette.chrome} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(420)}>
          <Pressable
            onPress={read}
            accessibilityRole="button"
            accessibilityLabel={`${fresh ? 'ابدأ القراءة' : 'تابع القراءة'}، ${where}`}
            style={({ pressed }) => [
              styles.continue,
              { backgroundColor: palette.surface, borderColor: palette.gold, opacity: pressed ? 0.9 : 1 },
            ]}>
            <View style={styles.continueTop}>
              <View style={styles.continueText}>
                <Text style={[styles.kicker, { color: palette.muted }]}>{fresh ? 'ابدأ القراءة' : 'تابع القراءة'}</Text>
                <Text style={[styles.where, { color: palette.chrome }]}>{where}</Text>
              </View>
              <View style={[styles.go, { backgroundColor: palette.goldDeep }]}>
                <ArrowForwardIcon size={20} color={palette.bg} />
              </View>
            </View>
            <Text numberOfLines={2} style={[styles.preview, { fontFamily: quranFont() }, { color: palette.ink }]}>
              {preview}
            </Text>
          </Pressable>
        </Animated.View>

        <DailyCard />

        <View style={styles.progress} accessible accessibilityLabel={`موضعك ${percent}٪ من المصحف، الجزء ${juz}`}>
          <View style={styles.progressText}>
            <Text style={[styles.small, { color: palette.chrome }]}>
              موضعك {formatNumber(percent, numerals)}٪ من المصحف
            </Text>
            <Text style={[styles.small, { color: palette.muted }]}>الجزء {formatNumber(juz, numerals)}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: palette.line }]}>
            <View style={[styles.fill, { backgroundColor: palette.gold, width: `${Math.max(percent, 1)}%` }]} />
          </View>
        </View>

        <View style={styles.grid}>
          <Shortcut palette={palette} icon={<ListIcon color={palette.gold} />} label="السور" onPress={() => openIndex('surahs')} />
          <Shortcut palette={palette} icon={<LayersIcon color={palette.gold} />} label="الأجزاء" onPress={() => openIndex('juz')} />
          <Shortcut
            palette={palette}
            icon={<BookmarkIcon color={palette.gold} />}
            label="المحفوظات"
            badge={bookmarkCount > 0 ? formatNumber(bookmarkCount, numerals) : undefined}
            onPress={() => openIndex('bookmarks')}
          />
          <Shortcut palette={palette} icon={<CompassIcon color={palette.gold} />} label="انتقال إلى آية" onPress={() => openIndex('goto')} />
        </View>

        <Pressable
          onPress={readDaily}
          accessibilityRole="button"
          accessibilityLabel={`آية اليوم: ${dailySurah.ayahs[daily.a - 1]}. سورة ${dailySurah.name}، الآية ${daily.a}`}
          style={({ pressed }) => [
            styles.daily,
            { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.9 : 1 },
          ]}>
          <View style={styles.dailyHead}>
            <View style={[styles.gem, { borderColor: palette.gold }]} />
            <Text style={[styles.kicker, { color: palette.goldDeep }]}>آية اليوم</Text>
          </View>
          <Text style={[styles.dailyAyah, { fontFamily: quranFont() }, { color: palette.ink }]}>{dailySurah.ayahs[daily.a - 1]}</Text>
          <Text style={[styles.small, styles.dailyRef, { color: palette.muted }]}>
            سورة {dailySurah.name}، الآية {formatNumber(daily.a, numerals)}
          </Text>
        </Pressable>

        <Text style={[styles.tip, { color: palette.muted }]}>
          المس أي آية لعرض التفسير الميسر تحتها، واضغط عليها مطولًا لحفظها أو نسخها أو مشاركتها.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  brand: {
    fontFamily: fonts.quran,
    fontSize: 34,
    lineHeight: 70,
  },
  continue: {
    borderWidth: 1.2,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  continueTop: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
  },
  continueText: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    alignSelf: ALIGN_START,
  },
  where: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  go: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    fontFamily: fonts.quran,
    fontSize: 22,
    lineHeight: 46,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  progress: {
    gap: 8,
    paddingHorizontal: 4,
  },
  progressText: {
    flexDirection: ROW,
    justifyContent: 'space-between',
  },
  small: {
    fontFamily: fonts.ui,
    fontSize: 13,
    writingDirection: 'rtl',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: ROW,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  grid: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcut: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 84,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    alignItems: ALIGN_START,
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
  },
  badge: {
    position: 'absolute',
    top: 12,
    fontFamily: fonts.uiBold,
    fontSize: 13,
  },
  daily: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },
  dailyHead: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  gem: {
    width: 8,
    height: 8,
    borderWidth: 1.2,
    transform: [{ rotate: '45deg' }],
  },
  dailyAyah: {
    fontFamily: fonts.quran,
    fontSize: 24,
    lineHeight: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 6,
  },
  dailyRef: {
    textAlign: 'center',
  },
  tip: {
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: 12,
  },
});
