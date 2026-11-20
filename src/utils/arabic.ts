const EASTERN_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export type Numerals = 'arabic' | 'western';

/** 286 → "٢٨٦" */
export function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => EASTERN_DIGITS[Number(d)]);
}

/** "٢٨٦" → "286". Leaves Western digits alone, so it accepts either kind of input. */
export function toWesternDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(EASTERN_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function formatNumber(value: number, numerals: Numerals): string {
  return numerals === 'arabic' ? toArabicDigits(value) : String(value);
}

/**
 * The counted noun follows Arabic number agreement:
 * ١ آية واحدة · ٢ آيتان · ٣–١٠ آيات · ١١ and up آية.
 * Above 100 the last two digits decide: ١١٠ آيات، ٢٠٦ آيات، ٢٨٦ آية، ٢٠٠ آية.
 */
export function ayahCountLabel(count: number, numerals: Numerals = 'arabic'): string {
  if (count === 1) return 'آية واحدة';
  if (count === 2) return 'آيتان';
  const lastTwo = count % 100;
  const noun = lastTwo >= 3 && lastTwo <= 10 ? 'آيات' : 'آية';
  return `${formatNumber(count, numerals)} ${noun}`;
}

export function revelationLabel(type: 'meccan' | 'medinan'): string {
  return type === 'meccan' ? 'مكية' : 'مدنية';
}
