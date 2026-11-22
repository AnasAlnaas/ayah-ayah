import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import raw from '@/assets/data/tafsir-muyassar.json';

import { getSurah, totalAyahs } from './quran';
import { type TafsirData, tafsirFor } from './tafsir';

const tafsir = raw as unknown as TafsirData;
const xmlPath = path.join(__dirname, '../../data-src/tanzil/ar.muyassar.xml');

describe('Tafsir al-Muyassar', () => {
  it('has one entry for every ayah', () => {
    expect(tafsir.ayahs).toHaveLength(totalAyahs());
    expect(tafsir.ayahs.every((t) => t.trim().length > 0)).toBe(true);
  });

  it('lines up with the right ayahs', () => {
    expect(tafsirFor(tafsir, 1, 1)).toContain('سورة الفاتحة');
    expect(tafsirFor(tafsir, 1, 2)).toContain('الثناء على الله');
    expect(tafsirFor(tafsir, 2, 255)).toContain('لا يستحق الألوهية والعبودية إلا هو');
    expect(tafsirFor(tafsir, 112, 1)).toContain('المتفرد بالألوهية');
    expect(tafsirFor(tafsir, 114, getSurah(114).ayahs.length)).toContain('شياطين الجن والإنس');
  });

  it('matches the pinned Tanzil file exactly', () => {
    const buf = readFileSync(xmlPath);
    expect(createHash('sha256').update(buf).digest('hex')).toBe(tafsir.source.sha256);
    const fromXml = [...buf.toString('utf8').matchAll(/<aya index="\d+" text="([^"]*)"/g)].map((m) =>
      m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
    );
    expect(tafsir.ayahs).toEqual(fromXml);
  });
});
