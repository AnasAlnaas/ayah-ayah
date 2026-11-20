import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

/**
 * On phones the route is a native form sheet, so this is just its background.
 * The web version (sheet-frame.web.tsx) draws the backdrop and panel itself.
 */
export function SheetFrame({ children }: { children: ReactNode; onClose: () => void }) {
  const palette = useTheme();
  return <View style={[styles.fill, { backgroundColor: palette.surface }]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 12 },
});
