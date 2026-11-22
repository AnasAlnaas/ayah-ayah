import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_600SemiBold } from '@expo-google-fonts/noto-naskh-arabic';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { type ComponentProps, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { Welcome } from '@/components/welcome';
import { useAppStore } from '@/store/app-store';
import { type Palette, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: 'index' };

/** Saved settings and position load asynchronously; wait for them before showing the reader. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAppStore.persist.onFinishHydration(onChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}

function navigationTheme(palette: Palette) {
  const base = palette.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.goldDeep,
      background: palette.bg,
      card: palette.surface,
      text: palette.ink,
      border: palette.line,
    },
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran_400Regular,
    KFGQPC_Qaloon: require('@/assets/fonts/qaloon.10.ttf'),
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_600SemiBold,
  });
  const hydrated = useHydrated();
  const palette = useTheme();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.bg).catch(() => {});
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = 'ar';
      document.body.style.backgroundColor = palette.bg;
    }
  }, [palette.bg]);

  if (!ready) return null;

  // Phones: a native form sheet. Web: a transparent route; SheetFrame draws the panel.
  const sheetOptions: ComponentProps<typeof Stack.Screen>['options'] =
    Platform.OS === 'web'
      ? { presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }
      : {
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: palette.surface },
        };

  return (
    <ThemeProvider value={navigationTheme(palette)}>
      <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="read" />
        <Stack.Screen name="navigate" options={sheetOptions} />
        <Stack.Screen name="tafsir" options={sheetOptions} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="about" />
      </Stack>
      <Welcome />
    </ThemeProvider>
  );
}
