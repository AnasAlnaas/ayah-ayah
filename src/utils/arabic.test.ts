import { ayahCountLabel, formatNumber, toArabicDigits, toWesternDigits } from './arabic';

describe('digits', () => {
  it('converts to Eastern Arabic digits', () => {
    expect(toArabicDigits(0)).toBe('٠');
    expect(toArabicDigits(286)).toBe('٢٨٦');
    expect(toArabicDigits('114:6')).toBe('١١٤:٦');
  });

  it('converts back to Western digits from Arabic or Persian input', () => {
    expect(toWesternDigits('٢٨٦')).toBe('286');
    expect(toWesternDigits('۱۲۳')).toBe('123');
    expect(toWesternDigits('12')).toBe('12');
  });

  it('formats by setting', () => {
    expect(formatNumber(7, 'arabic')).toBe('٧');
    expect(formatNumber(7, 'western')).toBe('7');
  });
});

describe('ayahCountLabel', () => {
  it.each([
    [1, 'آية واحدة'],
    [2, 'آيتان'],
    [3, '٣ آيات'],
    [7, '٧ آيات'],
    [10, '١٠ آيات'],
    [11, '١١ آية'],
    [99, '٩٩ آية'],
    [100, '١٠٠ آية'],
    [103, '١٠٣ آيات'],
    [110, '١١٠ آيات'],
    [111, '١١١ آية'],
    [200, '٢٠٠ آية'],
    [206, '٢٠٦ آيات'],
    [286, '٢٨٦ آية'],
  ])('%i → %s', (n, label) => {
    expect(ayahCountLabel(n)).toBe(label);
  });

  it('uses Western digits when asked', () => {
    expect(ayahCountLabel(286, 'western')).toBe('286 آية');
  });
});
