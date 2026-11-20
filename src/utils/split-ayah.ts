/**
 * Very long ayahs (2:282 is a full page of the mushaf) cannot fit on one phone
 * screen at a readable size. When shrinking the text is not enough, the ayah is
 * shown across consecutive cards, the way a printed mushaf continues an ayah on
 * the next page. Cuts fall between words, preferably right after a pause mark,
 * and never after the "do not stop" mark (ۙ).
 *
 * The text itself is never altered: joining the parts with a single space gives
 * back the original string exactly.
 */

/** Combining marks take no horizontal space of their own. */
const COMBINING = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ࣓-ࣿ]/g;

/** A token made only of Qur'anic signs (pause marks, ۞, ۩) belongs to the word before it. */
const SIGN_ONLY = /^[ۖ-۞۩]+$/;

/**
 * How good a place is to continue on the next card, by the pause mark that ends
 * the preceding word. Higher is better; -Infinity means never cut here.
 */
const CUT_PREFERENCE: Record<string, number> = {
  'ۘ': 5, // ۘ  م  compulsory stop
  'ۗ': 4, // ۗ  قلى stopping preferred
  'ۚ': 3, // ۚ  ج  stopping permissible
  'ۖ': 2, // ۖ  صلى continuing preferred
  'ۛ': 1, // ۛ  stop at one of the paired marks
  'ۙ': -Infinity, // ۙ  لا do not stop
};

/** Average advance width of a base glyph in Amiri Quran, in em. Measured in the browser. */
export const GLYPH_ADVANCE_EM = 0.39;

/** Extra lines lost to word wrapping. */
const WRAP_SLACK = 1.1;

export type TextBox = { width: number; height: number };

export function visualLength(text: string): number {
  return text.replace(COMBINING, '').length;
}

export function estimateTextHeight(text: string, fontSize: number, lineHeightRatio: number, width: number): number {
  const perLine = Math.max(1, Math.floor(width / (GLYPH_ADVANCE_EM * fontSize)));
  const lines = Math.max(1, Math.ceil((visualLength(text) / perLine) * WRAP_SLACK));
  return lines * fontSize * lineHeightRatio;
}

/** How many cards an ayah needs so that each part fits `box` at `fontSize`. */
export function partsNeeded(text: string, box: TextBox, fontSize: number, lineHeightRatio: number): number {
  const height = estimateTextHeight(text, fontSize, lineHeightRatio, box.width);
  if (height <= box.height) return 1;
  // Aim for parts that fill about 85% of the card, leaving room for estimation error.
  return Math.ceil(height / (box.height * 0.85));
}

type Word = { text: string; weight: number; cut: number };

function toWords(text: string): Word[] {
  const words: Word[] = [];
  for (const token of text.split(' ')) {
    const last = words[words.length - 1];
    if (last && SIGN_ONLY.test(token)) {
      last.text += ` ${token}`;
      last.weight += 1;
      for (const ch of token) {
        if (ch in CUT_PREFERENCE) last.cut = CUT_PREFERENCE[ch];
      }
    } else {
      words.push({ text: token, weight: visualLength(token) + 1, cut: 0 });
    }
  }
  return words;
}

/** Splits `text` into `parts` pieces at the best boundaries. Returns [text] when parts ≤ 1. */
export function splitAyah(text: string, parts: number): string[] {
  const words = toWords(text);
  const count = Math.min(Math.max(1, Math.floor(parts)), words.length);
  if (count <= 1) return [text];

  const total = words.reduce((sum, w) => sum + w.weight, 0);
  const partWeight = total / count;
  // Cumulative weight after each word: cutting after word i leaves `cum[i]` before the cut.
  const cum: number[] = [];
  words.reduce((sum, w, i) => (cum[i] = sum + w.weight), 0);

  const cuts: number[] = [];
  let previous = -1;
  for (let j = 1; j < count; j++) {
    const ideal = partWeight * j;
    const lastAllowed = words.length - 1 - (count - j); // leave at least one word per remaining part
    let best = -1;
    let bestScore = -Infinity;
    for (let i = previous + 1; i <= lastAllowed; i++) {
      const distance = Math.abs(cum[i] - ideal) / partWeight; // 0 at the ideal spot, 1 a whole part away
      const preference = words[i].cut;
      if (preference === -Infinity) continue;
      const score = preference * 0.08 - distance;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best === -1) best = Math.min(Math.max(previous + 1, 0), lastAllowed);
    cuts.push(best);
    previous = best;
  }

  const out: string[] = [];
  let start = 0;
  for (const cut of [...cuts, words.length - 1]) {
    out.push(
      words
        .slice(start, cut + 1)
        .map((w) => w.text)
        .join(' '),
    );
    start = cut + 1;
  }
  return out;
}
