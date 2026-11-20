import { AYAH_FONT_SIZE, AYAH_LINE_HEIGHT, MAX_COLUMN_WIDTH, MIN_SHRINK } from '@/theme';
import { partsNeeded, splitAyah, type TextBox } from '@/utils/split-ayah';

export type CardLayout = {
  /** Size of one card: the whole list viewport */
  width: number;
  height: number;
  /** Width of the readable column (narrower than the card on tablets and desktop) */
  columnWidth: number;
  /** Where the column starts from the left edge */
  columnLeft: number;
  padTop: number;
  padBottom: number;
  /** Space the ayah text may take */
  textBox: TextBox;
  /** Ayah font size at the chosen text size, before any shrinking */
  baseFont: number;
  /** Changes whenever the way ayahs are split could change */
  key: string;
};

const SIDE_PADDING = 30;
/** Ayah number diamond and the space above and below it */
export const FOOTER_HEIGHT = 96;

export function cardLayout(
  width: number,
  height: number,
  insets: { top: number; bottom: number },
  fontScale: number,
): CardLayout {
  const columnWidth = Math.min(width, MAX_COLUMN_WIDTH);
  const padTop = insets.top + 64;
  const padBottom = insets.bottom + 48;
  const textBox = {
    width: Math.max(120, columnWidth - SIDE_PADDING * 2),
    height: Math.max(120, height - padTop - padBottom - FOOTER_HEIGHT),
  };
  const baseFont = Math.round(AYAH_FONT_SIZE * fontScale);
  return {
    width,
    height,
    columnWidth,
    columnLeft: (width - columnWidth) / 2,
    padTop,
    padBottom,
    textBox,
    baseFont,
    key: `${Math.round(textBox.width)}x${Math.round(textBox.height)}@${baseFont}`,
  };
}

/** Line height shrinks a little with the text, so long ayahs keep their room. */
export function lineHeightRatio(fontSize: number, baseFont: number): number {
  return fontSize >= baseFont * 0.85 ? AYAH_LINE_HEIGHT : 2.05;
}

export function minFontSize(baseFont: number): number {
  return Math.round(baseFont * MIN_SHRINK);
}

/** Decides how many cards each ayah needs for this layout. */
export function makeSplitter(layout: CardLayout): (text: string) => string[] {
  const size = minFontSize(layout.baseFont);
  const ratio = lineHeightRatio(size, layout.baseFont);
  return (text) => {
    const parts = partsNeeded(text, layout.textBox, size, ratio);
    return parts <= 1 ? [text] : splitAyah(text, parts);
  };
}
