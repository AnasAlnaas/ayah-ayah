import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Segmented } from '@/components/segmented';
import { activeRiwayah, getSurah, type Riwayah } from '@/data/quran';
import { useAppStore } from '@/store/app-store';
import { AYAH_FONT_SIZE, AYAH_LINE_HEIGHT, FONT_SCALES, fonts, useTheme, quranFont } from '@/theme';
import { formatNumber } from '@/utils/arabic';
import { ALIGN_START, ROW } from '@/utils/rtl';

const GOALS = [5, 10, 20, 50, 100];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const palette = useTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: palette.muted }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>{children}</View>
    </View>
  );
}

/** react-native-web's Switch has its own "on" thumb colour (teal by default). */
function webSwitchColors(color: string): object {
  return Platform.OS === 'web' ? { activeThumbColor: color } : {};
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const palette = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: palette.line, true: palette.gold }}
        thumbColor={Platform.OS === 'ios' ? undefined : palette.surface}
        {...webSwitchColors(palette.surface)}
      />
    </View>
  );
}

export function Settings() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale, theme, numerals, keepAwake, haptics, dailyGoal, riwayah, set, setRiwayah } = useAppStore();

  const scaleIndex = Math.max(0, FONT_SCALES.indexOf(fontScale as (typeof FONT_SCALES)[number]));
  const changeSize = (step: number) => {
    const next = FONT_SCALES[Math.min(Math.max(scaleIndex + step, 0), FONT_SCALES.length - 1)];
    set({ fontScale: next });
  };
  const previewSize = Math.round(AYAH_FONT_SIZE * fontScale);
  const percent = `${formatNumber(Math.round(fontScale * 100), numerals)}٪`;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="الإعدادات" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Section title="الرواية">
          <View style={styles.padded}>
            <Segmented
              accessibilityLabel="رواية المصحف"
              value={riwayah}
              onChange={(v) => setRiwayah(v as Riwayah)}
              options={[
                { value: 'hafs', label: 'حفص عن عاصم' },
                { value: 'qalun', label: 'قالون عن نافع' },
              ]}
            />
            <Text style={[styles.hint, { color: palette.muted }]}>
              ينتقل موضع قراءتك والآيات المحفوظة إلى ترقيم الرواية الجديدة. التفسير الميسر مبني على رواية حفص، فيظهر مع قالون تفسير الآيات المقابلة.
            </Text>
          </View>
        </Section>

        <Section title="حجم الخط">
          <View style={styles.stepper}>
            <Pressable
              onPress={() => changeSize(1)}
              disabled={scaleIndex === FONT_SCALES.length - 1}
              accessibilityRole="button"
              accessibilityLabel="تكبير الخط"
              style={[styles.stepButton, { borderColor: palette.line, opacity: scaleIndex === FONT_SCALES.length - 1 ? 0.4 : 1 }]}>
              <Text style={[styles.stepText, { color: palette.goldDeep }]}>أ+</Text>
            </Pressable>
            <Text accessibilityLiveRegion="polite" style={[styles.stepValue, { color: palette.ink }]}>
              {percent}
            </Text>
            <Pressable
              onPress={() => changeSize(-1)}
              disabled={scaleIndex === 0}
              accessibilityRole="button"
              accessibilityLabel="تصغير الخط"
              style={[styles.stepButton, { borderColor: palette.line, opacity: scaleIndex === 0 ? 0.4 : 1 }]}>
              <Text style={[styles.stepText, { color: palette.goldDeep }]}>أ−</Text>
            </Pressable>
          </View>
          <View style={[styles.preview, { backgroundColor: palette.bg, borderColor: palette.line }]}>
            <Text
              style={{
                fontFamily: quranFont(),
                fontSize: previewSize,
                lineHeight: Math.round(previewSize * AYAH_LINE_HEIGHT),
                color: palette.ink,
                textAlign: 'center',
                writingDirection: 'rtl',
              }}>
              {getSurah(1).ayahs[activeRiwayah() === 'qalun' ? 0 : 1]}
            </Text>
          </View>
        </Section>

        <Section title="الوِرد اليومي">
          <View style={styles.padded}>
            <Segmented
              accessibilityLabel="عدد الآيات في اليوم"
              value={String(dailyGoal)}
              onChange={(v) => set({ dailyGoal: Number(v) })}
              options={GOALS.map((g) => ({ value: String(g), label: formatNumber(g, numerals), accessibilityLabel: `${g} آية في اليوم` }))}
            />
            <Text style={[styles.hint, { color: palette.muted }]}>
              آية في اليوم. تُحسب الآية بعد ثلاث ثوانٍ على الشاشة، ويُتجاوَز عن يوم واحد في الأسبوع دون أن تنقطع السلسلة.
            </Text>
          </View>
        </Section>

        <Section title="المظهر">
          <View style={styles.padded}>
            <Segmented
              accessibilityLabel="المظهر"
              value={theme}
              onChange={(v) => set({ theme: v })}
              options={[
                { value: 'system', label: 'تلقائي' },
                { value: 'light', label: 'فاتح' },
                { value: 'dark', label: 'داكن' },
              ]}
            />
          </View>
        </Section>

        <Section title="الأرقام">
          <View style={styles.padded}>
            <Segmented
              accessibilityLabel="شكل الأرقام"
              value={numerals}
              onChange={(v) => set({ numerals: v })}
              options={[
                { value: 'arabic', label: '١٢٣', accessibilityLabel: 'أرقام عربية مشرقية' },
                { value: 'western', label: '123', accessibilityLabel: 'أرقام غربية' },
              ]}
            />
          </View>
        </Section>

        <Section title="أثناء القراءة">
          <ToggleRow label="إبقاء الشاشة مضاءة" value={keepAwake} onChange={(v) => set({ keepAwake: v })} />
          {Platform.OS !== 'web' && (
            <>
              <View style={[styles.divider, { backgroundColor: palette.line }]} />
              <ToggleRow label="اهتزاز خفيف عند بداية كل سورة" value={haptics} onChange={(v) => set({ haptics: v })} />
            </>
          )}
        </Section>

        <Section title="">
          <Pressable
            onPress={() => router.push('/about')}
            accessibilityRole="link"
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.highlight }]}>
            <Text style={[styles.rowLabel, { color: palette.ink }]}>عن التطبيق</Text>
            <Text style={[styles.chevron, { color: palette.muted }]}>‹</Text>
          </Pressable>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  section: {
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    alignSelf: ALIGN_START,
    paddingHorizontal: 6,
    writingDirection: 'rtl',
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  padded: {
    padding: 12,
    gap: 10,
  },
  hint: {
    fontFamily: fonts.ui,
    fontSize: 12,
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  chevron: {
    fontSize: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  stepper: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  stepButton: {
    width: 64,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fonts.uiBold,
    fontSize: 20,
  },
  stepValue: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
  },
  preview: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
