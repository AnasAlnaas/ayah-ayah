import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, useTheme } from '@/theme';
import { ROW } from '@/utils/rtl';

/** Title with a back button on the right, where Arabic readers expect it. */
export function ScreenHeader({ title }: { title: string }) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8, borderColor: palette.line }]}>
      <View style={styles.bar}>
        <Pressable
          onPress={back}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          style={styles.side}>
          <Text style={[styles.back, { color: palette.goldDeep }]}>→ رجوع</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: palette.chrome }]}>
          {title}
        </Text>
        <View style={styles.side} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 40,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  side: {
    minWidth: 72,
  },
  back: {
    fontFamily: fonts.ui,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
  },
});
