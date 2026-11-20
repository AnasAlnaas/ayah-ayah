import { useColorScheme } from 'react-native';

import { useAppStore } from '@/store/app-store';

export type Palette = {
  /** Page background (parchment / night) */
  bg: string;
  /** Raised surfaces: sheet, rows, inputs */
  surface: string;
  /** Hairlines and the progress-rail track */
  line: string;
  /** Ayah text */
  ink: string;
  /** Top bar and interface text */
  chrome: string;
  /** Ornaments: frames, diamonds, rail fill */
  gold: string;
  /** Ayah numbers and highlighted text */
  goldDeep: string;
  /** Secondary text; meets 4.5:1 on bg */
  muted: string;
  /** Highlighted row background */
  highlight: string;
  scheme: 'light' | 'dark';
};

// Light values come from the prototype. muted and goldDeep are a shade darker
// than the prototype so small text passes WCAG AA contrast on parchment.
export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    bg: '#f6f0e4',
    surface: '#fbf7ef',
    line: '#e4d9c4',
    ink: '#2a2116',
    chrome: '#5b4a32',
    gold: '#b08d57',
    goldDeep: '#806030',
    muted: '#7a6547',
    highlight: '#efe4cf',
    scheme: 'light',
  },
  dark: {
    bg: '#14120f',
    surface: '#1d1a16',
    line: '#2b261f',
    ink: '#ece3d2',
    chrome: '#c9b896',
    gold: '#c9a46a',
    goldDeep: '#d9b77d',
    muted: '#9c8b6e',
    highlight: '#2a241b',
    scheme: 'dark',
  },
};

export const fonts = {
  quran: 'AmiriQuran_400Regular',
  ui: 'NotoNaskhArabic_400Regular',
  uiBold: 'NotoNaskhArabic_600SemiBold',
} as const;

/** Ayah text at 100%: the prototype's 31 px with a 2.3 line height. */
export const AYAH_FONT_SIZE = 31;
export const AYAH_LINE_HEIGHT = 2.3;
/** Long ayahs may shrink to this share of the chosen size before continuing on a new card. */
export const MIN_SHRINK = 0.65;

export const FONT_SCALES = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6] as const;

/** Readable column width on tablets and desktop browsers. */
export const MAX_COLUMN_WIDTH = 560;

export function useTheme(): Palette {
  const system = useColorScheme();
  const setting = useAppStore((s) => s.theme);
  const scheme = setting === 'system' ? (system === 'dark' ? 'dark' : 'light') : setting;
  return palettes[scheme];
}
