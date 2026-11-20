import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeIcon } from '@/components/icons';
import { fonts, type Palette } from '@/theme';
import { ROW } from '@/utils/rtl';

type Props = {
  title: string;
  detail: string;
  topInset: number;
  columnWidth: number;
  palette: Palette;
  onOpenIndex: () => void;
  onHome: () => void;
};

export function TopBar({ title, detail, topInset, columnWidth, palette, onOpenIndex, onHome }: Props) {
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <LinearGradient
        pointerEvents="box-none"
        colors={[palette.bg, palette.bg, `${palette.bg}00`]}
        locations={[0, 0.7, 1]}
        style={{ paddingTop: topInset + 14, paddingBottom: 22 }}>
        <View pointerEvents="box-none" style={[styles.bar, { width: columnWidth }]}>
          <Pressable
            onPress={onOpenIndex}
            accessibilityRole="button"
            accessibilityLabel={`${title}، ${detail}`}
            accessibilityHint="يفتح الفهرس"
            hitSlop={8}
            style={styles.index}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: palette.chrome }]}>{title}</Text>
              <Text style={[styles.caret, { color: palette.muted }]}>▾</Text>
            </View>
            <Text style={[styles.detail, { color: palette.chrome }]}>{detail}</Text>
          </Pressable>
          <Pressable
            onPress={onHome}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="الصفحة الرئيسية"
            style={styles.home}>
            <HomeIcon size={20} color={palette.chrome} />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  bar: {
    alignSelf: 'center',
    flexDirection: ROW,
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 14,
    minHeight: 36,
  },
  index: {
    flex: 1,
    flexDirection: ROW,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
    writingDirection: 'rtl',
  },
  caret: {
    fontSize: 11,
  },
  detail: {
    fontFamily: fonts.ui,
    fontSize: 13,
    opacity: 0.85,
    writingDirection: 'rtl',
  },
  home: {
    padding: 2,
  },
});
