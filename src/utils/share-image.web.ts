import { SHARE_CARD_RATIO } from '@/components/share-card';
import { getSurah } from '@/data/quran';
import { fonts, palettes } from '@/theme';

import { toArabicDigits } from './arabic';
import type { ShareImageRequest, ShareResult } from './share-image';

export type { ShareImageRequest, ShareResult } from './share-image';

const WIDTH = 1080;
const HEIGHT = Math.round(WIDTH * SHARE_CARD_RATIO);
const U = WIDTH / 360; // same units as the on-screen ShareCard

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws the share card on a canvas. The browser shapes the Arabic itself. */
async function renderCard(s: number, a: number): Promise<Blob> {
  const p = palettes.light;
  const surah = getSurah(s);
  const text = surah.ayahs[a - 1];
  await Promise.all([
    document.fonts.load(`40px ${fonts.quran}`),
    document.fonts.load(`20px ${fonts.ui}`),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Double gold frame
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 1.6 * U;
  roundRect(ctx, 14 * U, 14 * U, WIDTH - 28 * U, HEIGHT - 28 * U, 18 * U);
  ctx.stroke();
  ctx.lineWidth = 0.6 * U;
  roundRect(ctx, 20 * U, 20 * U, WIDTH - 40 * U, HEIGHT - 40 * U, 14 * U);
  ctx.stroke();

  // Surah title
  ctx.fillStyle = p.goldDeep;
  ctx.font = `${19 * U}px ${fonts.quran}`;
  ctx.fillText(`سُورَةُ ${surah.name}`, WIDTH / 2, 56 * U);

  // Ayah text, as large as fits
  const boxW = WIDTH - 72 * U;
  const boxTop = 92 * U;
  const boxH = HEIGHT - 190 * U;
  let size = 26 * U;
  let lines: string[] = [];
  let lineHeight = 0;
  for (; size > 8 * U; size *= 0.95) {
    ctx.font = `${size}px ${fonts.quran}`;
    lineHeight = size * (size > 22 * U ? 2.2 : 2.0);
    lines = wrap(ctx, text, boxW);
    if (lines.length * lineHeight <= boxH) break;
  }
  ctx.fillStyle = p.ink;
  const startY = boxTop + (boxH - lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, i) => ctx.fillText(line, WIDTH / 2, startY + i * lineHeight));

  // Ayah number in its diamond
  const cy = HEIGHT - 76 * U;
  const r = 15 * U * Math.SQRT2;
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 1 * U;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, cy - r);
  ctx.lineTo(WIDTH / 2 + r, cy);
  ctx.lineTo(WIDTH / 2, cy + r);
  ctx.lineTo(WIDTH / 2 - r, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = p.goldDeep;
  ctx.font = `${(a >= 100 ? 10 : 12) * U}px ${fonts.ui}`;
  ctx.fillText(toArabicDigits(a), WIDTH / 2, cy + 1 * U);

  ctx.fillStyle = p.muted;
  ctx.font = `${11 * U}px ${fonts.ui}`;
  ctx.fillText('آية آية', WIDTH / 2, HEIGHT - 36 * U);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png'),
  );
}

/** Web: share the image where the browser supports it, otherwise download it. */
export async function shareAyahImage({ s, a, surahName }: ShareImageRequest): Promise<ShareResult> {
  const blob = await renderCard(s, a);
  const file = new File([blob], `ayah-${s}-${a}.png`, { type: 'image/png' });
  const title = `سورة ${surahName}، الآية ${toArabicDigits(a)}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
