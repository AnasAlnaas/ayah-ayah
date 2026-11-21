import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlameIcon } from '@/components/icons';
import { useDailyProgress } from '@/hooks/use-daily-progress';
import { useAppStore } from '@/store/app-store';
import { fonts, useTheme } from '@/theme';
import { ayahCountLabel, formatNumber } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';
import { dayCountLabel } from '@/utils/streak';

/** Arabic weekday initials, Sunday first (Date.getDay order). */
const WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

/** Today's wird: progress towards the goal, the streak, and the last 7 days. */
export function DailyCard() {
  const palette = useTheme();
  const numerals = useAppStore((s) => s.numerals);
  const { goal, readToday, done, streak, week } = useDailyProgress();
  const shown = Math.min(readToday, goal);
  const share = goal > 0 ? shown / goal : 0;

  const status = done
    ? 'أتممت وِرد اليوم'
    : `${formatNumber(shown, numerals)} من ${ayahCountLabel(goal, numerals)}`;
  const streakText = streak > 0 ? `سلسلة ${dayCountLabel(streak, numerals)}` : 'ابدأ سلسلتك اليوم';

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      accessibilityRole="button"
      accessibilityLabel={`وِرد اليوم: ${status}. ${streakText}`}
      accessibilityHint="يفتح الإعدادات لتغيير الهدف اليومي"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: done ? palette.gold : palette.line, opacity: pressed ? 0.9 : 1 },
      ]}>
      <View style={styles.top}>
        <View style={styles.titleBox}>
          <Text style={[styles.kicker, { color: palette.goldDeep }]}>وِرد اليوم</Text>
          <Text style={[styles.status, { color: palette.ink }]}>{status}</Text>
        </View>
        <View style={styles.streak}>
          <FlameIcon size={24} color={palette.gold} filled={streak > 0} />
          <Text style={[styles.streakText, { color: streak > 0 ? palette.goldDeep : palette.muted }]}>{streakText}</Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: palette.line }]}>
        <View style={[styles.fill, { backgroundColor: palette.gold, width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }]} />
      </View>

      <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {week.map(({ day, state }) => {
          const weekday = new Date(day * 86_400_000).getUTCDay();
          const isToday = state === 'pending' || day === week[6].day;
          return (
            <View key={day} style={styles.dayCol}>
              <View
                style={[
                  styles.dot,
                  { borderColor: palette.gold },
                  state === 'met' && { backgroundColor: palette.gold },
                  state === 'free' && { borderStyle: 'dashed' },
                  state === 'missed' && { borderColor: palette.line },
                ]}
              />
              <Text style={[styles.dayLabel, { color: isToday ? palette.goldDeep : palette.muted }]}>{WEEKDAYS[weekday]}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.note, { color: palette.muted }]}>
        تُحسب الآية بعد ثلاث ثوانٍ من قراءتها. يُتجاوَز عن يوم واحد في الأسبوع.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 12,
  },
  top: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
  },
  titleBox: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    alignSelf: ALIGN_START,
  },
  status: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    alignSelf: ALIGN_START,
    writingDirection: 'rtl',
  },
  streak: {
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: ROW,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  week: {
    flexDirection: ROW,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderWidth: 1.4,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  dayLabel: {
    fontFamily: fonts.ui,
    fontSize: 11,
  },
  note: {
    fontFamily: fonts.ui,
    fontSize: 11,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
