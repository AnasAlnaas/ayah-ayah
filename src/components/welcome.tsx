import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/segmented';
import { hafsQuran, qalunQuran, type Riwayah } from '@/data/quran';
import { GOALS } from '@/screens/settings';
import { useAppStore } from '@/store/app-store';
import { AYAH_FONT_SIZE, AYAH_LINE_HEIGHT, fonts, useTheme } from '@/theme';
import { formatNumber } from '@/utils/arabic';
import { ALIGN_START } from '@/utils/rtl';

const SIZES = [0.9, 1, 1.2, 1.4];
const SIZE_LABELS = ['صغير', 'متوسط', 'كبير', 'أكبر'];

function Field({ title, children }: { title: string; children: ReactNode }) {
  const palette = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldTitle, { color: palette.muted }]}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * Shown once, on the first launch: the few choices worth making before the
 * first ayah. Everything here can be changed later in the settings.
 */
export function Welcome() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const { onboarded, riwayah, theme, fontScale, dailyGoal, numerals, set, setRiwayah } = useAppStore();
  if (onboarded) return null;

  // Read straight from each text so the preview follows the choice without a remount.
  const preview = riwayah === 'qalun' ? qalunQuran.surahs[0].ayahs[0] : hafsQuran.surahs[0].ayahs[1];
  const previewSize = Math.round(AYAH_FONT_SIZE * fontScale * 0.85);
  const size = SIZES.includes(fontScale) ? String(fontScale) : '1';
  const finish = () => set({ onboarded: true });

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={finish}>
      <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, styles.backdrop]} />
      <View style={[styles.center, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.brand, { color: palette.goldDeep }]}>آية آية</Text>
            <Text style={[styles.lead, { color: palette.chrome }]}>أهلًا بك. اختر ما يناسبك، ويمكنك تغييره لاحقًا من الإعدادات.</Text>

            <Field title="الرواية">
              <Segmented
                accessibilityLabel="رواية المصحف"
                value={riwayah}
                onChange={(v) => setRiwayah(v as Riwayah)}
                options={[
                  { value: 'qalun', label: 'قالون عن نافع' },
                  { value: 'hafs', label: 'حفص عن عاصم' },
                ]}
              />
            </Field>

            <Field title="المظهر">
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
            </Field>

            <Field title="حجم الخط">
              <Segmented
                accessibilityLabel="حجم الخط"
                value={size}
                onChange={(v) => set({ fontScale: Number(v) })}
                options={SIZES.map((s, i) => ({ value: String(s), label: SIZE_LABELS[i] }))}
              />
              <View style={[styles.preview, { backgroundColor: palette.bg, borderColor: palette.line }]}>
                <Text
                  style={{
                    fontFamily: riwayah === 'qalun' ? fonts.qalun : fonts.quran,
                    fontSize: previewSize,
                    lineHeight: Math.round(previewSize * AYAH_LINE_HEIGHT),
                    color: palette.ink,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                  }}>
                  {preview}
                </Text>
              </View>
            </Field>

            <Field title="الوِرد اليومي (آية في اليوم)">
              <Segmented
                accessibilityLabel="عدد الآيات في اليوم"
                value={String(dailyGoal)}
                onChange={(v) => set({ dailyGoal: Number(v) })}
                options={GOALS.map((g) => ({ value: String(g), label: formatNumber(g, numerals), accessibilityLabel: `${g} آية في اليوم` }))}
              />
            </Field>

            <Field title="الأرقام">
              <Segmented
                accessibilityLabel="شكل الأرقام"
                value={numerals}
                onChange={(v) => set({ numerals: v })}
                options={[
                  { value: 'arabic', label: '١٢٣', accessibilityLabel: 'أرقام عربية مشرقية' },
                  { value: 'western', label: '123', accessibilityLabel: 'أرقام غربية' },
                ]}
              />
            </Field>
          </ScrollView>
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            style={({ pressed }) => [styles.start, { backgroundColor: palette.goldDeep, opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[styles.startText, { color: palette.surface }]}>ابدأ القراءة</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  brand: {
    fontFamily: fonts.quran,
    fontSize: 34,
    lineHeight: 68,
    textAlign: 'center',
  },
  lead: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: -12,
  },
  field: {
    gap: 8,
  },
  fieldTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    alignSelf: ALIGN_START,
  },
  preview: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  start: {
    margin: 16,
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startText: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
  },
});
