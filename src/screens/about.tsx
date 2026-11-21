import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { quran } from '@/data/quran';
import { fonts, useTheme } from '@/theme';
import { ALIGN_START } from '@/utils/rtl';

function Block({ title, children }: { title: string; children: ReactNode }) {
  const palette = useTheme();
  return (
    <View style={[styles.block, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Text accessibilityRole="header" style={[styles.blockTitle, { color: palette.goldDeep }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Link({ url, label }: { url: string; label: string }) {
  const palette = useTheme();
  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(url)} accessibilityRole="link" hitSlop={6}>
      <Text style={[styles.link, { color: palette.goldDeep }]}>{label}</Text>
    </Pressable>
  );
}

export function About() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const body = [styles.body, { color: palette.ink }];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScreenHeader title="عن التطبيق" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.hero}>
          <Text style={[styles.name, { color: palette.goldDeep }]}>آية آية</Text>
          <Text style={[styles.version, { color: palette.muted }]}>الإصدار {version}</Text>
          <Text style={[styles.tagline, { color: palette.chrome }]}>القرآن الكريم، آيةً بعد آية.</Text>
        </View>

        <Block title="نص المصحف">
          <Text style={body}>
            النص القرآني بالرسم العثماني برواية حفص عن عاصم، من مشروع تنزيل (Tanzil Project)، منقول كما هو دون أي تعديل.
          </Text>
          <Link url={quran.source.url} label="tanzil.net" />
          <Text style={[styles.notice, { color: palette.muted, borderColor: palette.line }]}>{quran.source.notice}</Text>
        </Block>

        <Block title="التفسير">
          <Text style={body}>
            التفسير الميسر، من إعداد نخبة من العلماء بإشراف مجمع الملك فهد لطباعة المصحف الشريف، كما ينشره مشروع تنزيل. يُستخدم هنا
            استخدامًا غير تجاري، والتطبيق مجاني بلا إعلانات.
          </Text>
          <Link url="https://tanzil.net/trans/" label="tanzil.net/trans" />
        </Block>

        <Block title="الخطوط">
          <Text style={body}>خط الآيات: Amiri Quran — مشروع أميري، برخصة SIL Open Font License 1.1.</Text>
          <Text style={body}>خط الواجهة: Noto Naskh Arabic — مشروع Noto، برخصة SIL Open Font License 1.1.</Text>
          <Link url="https://openfontlicense.org" label="openfontlicense.org" />
        </Block>

        <Block title="الخصوصية">
          <Text style={body}>
            لا يجمع التطبيق أي بيانات، ولا يحتاج إلى حساب أو اتصال بالإنترنت. موضع قراءتك وإعداداتك والآيات المحفوظة كلها على جهازك فقط.
          </Text>
          <Link url="https://anasalnaas.github.io/ayah-ayah/privacy-policy" label="سياسة الخصوصية" />
        </Block>
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
    gap: 14,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  name: {
    fontFamily: fonts.quran,
    fontSize: 40,
    lineHeight: 80,
  },
  version: {
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  tagline: {
    fontFamily: fonts.ui,
    fontSize: 15,
    marginTop: 6,
  },
  block: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  blockTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 15,
    alignSelf: ALIGN_START,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 26,
    writingDirection: 'rtl',
  },
  link: {
    fontFamily: fonts.ui,
    fontSize: 15,
    textDecorationLine: 'underline',
    alignSelf: ALIGN_START,
  },
  notice: {
    fontFamily: undefined,
    fontSize: 11,
    lineHeight: 16,
    writingDirection: 'ltr',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
});
