import { type ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/theme';

/**
 * Expo Router shows modal routes as plain pages on the web, so the sheet's
 * backdrop and panel are drawn here: a bottom sheet on narrow screens, a centred
 * panel on wide ones. Escape or a click on the backdrop closes it.
 */
export function SheetFrame({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const palette = useTheme();
  const { width, height } = useWindowDimensions();
  const wide = width >= 700;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <View style={[styles.root, wide && styles.centered]}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="إغلاق"
      />
      <View
        accessibilityViewIsModal
        style={[
          styles.panel,
          { backgroundColor: palette.surface, borderColor: palette.line },
          wide
            ? { width: 520, height: Math.min(760, height - 64), borderRadius: 24 }
            : { height: height * 0.92, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
        ]}>
        <View style={[styles.grabber, { backgroundColor: palette.line }]} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(20, 16, 10, 0.4)',
  },
  panel: {
    width: '100%',
    maxWidth: 640,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 4,
  },
});
