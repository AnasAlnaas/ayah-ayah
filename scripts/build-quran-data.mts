/**
 * Builds assets/data/quran.json and assets/data/tafsir-muyassar.json from the
 * pinned Tanzil files in data-src/tanzil/.
 *
 * The Qur'an text is copied verbatim. This script never edits a single character
 * of it: it only reads, checks and re-packages. Any check that fails stops the
 * build so a broken file can never reach the app.
 *
 * Run with:  npm run build:data   (Node 22.18+ runs this TypeScript file directly)
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'data-src', 'tanzil');
const outFile = path.join(root, 'assets', 'data', 'quran.json');
const tafsirOutFile = path.join(root, 'assets', 'data', 'tafsir-muyassar.json');

// The exact files we reviewed. A different download must be reviewed and
// re-pinned on purpose, never picked up by accident.
const PINNED_SHA256: Record<string, string> = {
  'quran-uthmani.xml': '8c5aeae20363a98f6963720d29fce040ca8b56a8e75f8b564c257fce7f6d0417',
  'quran-data.xml': '8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a',
  'ar.muyassar.xml': '099388626fb53cee121314164b1552140c2805ba4bab79cd181e0748d5756c6d',
};

const TOTAL_SURAHS = 114;
const TOTAL_AYAHS = 6236;
const SAJDAH_SIGN = '۩'; // ۩

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) fail(message);
}

function readPinned(name: string): string {
  const buf = readFileSync(path.join(srcDir, name));
  const hash = createHash('sha256').update(buf).digest('hex');
  check(
    hash === PINNED_SHA256[name],
    `${name} has changed (sha256 ${hash}). Review the new file, then update PINNED_SHA256.`,
  );
  return buf.toString('utf8');
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decode(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return ENTITIES[code] ?? match;
  });
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}

function int(value: string | undefined, what: string): number {
  const n = Number(value);
  check(Number.isInteger(n), `${what} is not an integer: ${value}`);
  return n;
}

function block(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  check(m, `<${name}> section missing from metadata`);
  return m[1];
}

// ---------------------------------------------------------------------------

const textXml = readPinned('quran-uthmani.xml');
const metaXml = readPinned('quran-data.xml');

const noticeMatch = textXml.match(/<!--([\s\S]*?)-->/);
check(noticeMatch, 'Tanzil copyright notice not found in the text file');
const notice = noticeMatch[1].replace(/^\s*\n/, '').replace(/\s+$/, '');
check(notice.includes('Tanzil Project'), 'Copyright notice does not mention Tanzil Project');
const versionMatch = notice.match(/Tanzil Quran Text \(([^)]+)\)/);
check(versionMatch, 'Could not read the Tanzil text version from the notice');

// Metadata
const metaSurahs = [...block(metaXml, 'suras').matchAll(/<sura\s([^>]*?)\/>/g)].map((m) => attrs(m[1]));
check(metaSurahs.length === TOTAL_SURAHS, `metadata lists ${metaSurahs.length} surahs`);

const juz = [...block(metaXml, 'juzs').matchAll(/<juz\s([^>]*?)\/>/g)].map((m, i) => {
  const a = attrs(m[1]);
  check(int(a.index, 'juz index') === i + 1, `juz ${i + 1} out of order`);
  return [int(a.sura, 'juz sura'), int(a.aya, 'juz aya')] as [number, number];
});
check(juz.length === 30, `metadata lists ${juz.length} juz`);

const sajdas = [...block(metaXml, 'sajdas').matchAll(/<sajda\s([^>]*?)\/>/g)].map((m) => {
  const a = attrs(m[1]);
  return [int(a.sura, 'sajda sura'), int(a.aya, 'sajda aya'), a.type] as [number, number, string];
});
check(sajdas.length === 15, `metadata lists ${sajdas.length} sajdah positions`);

// Text
type Surah = {
  n: number;
  name: string;
  nameEn: string;
  type: 'meccan' | 'medinan';
  /** Verbatim from the text file. Null for Al-Fatiha (it is ayah 1) and At-Tawbah. */
  basmala: string | null;
  ayahs: string[];
};

const basmalaForms = new Map<string, number[]>();
let ayahTotal = 0;
let expectedStart = 0;

const surahs: Surah[] = [...textXml.matchAll(/<sura\s([^>]*)>([\s\S]*?)<\/sura>/g)].map((m, i) => {
  const sa = attrs(m[1]);
  const n = int(sa.index, 'sura index');
  const meta = metaSurahs[i];
  check(n === i + 1, `surah ${i + 1} out of order`);
  check(int(meta.index, 'meta sura index') === n, `metadata surah ${n} out of order`);
  check(sa.name === meta.name, `surah ${n} name differs between text and metadata`);
  check(meta.type === 'Meccan' || meta.type === 'Medinan', `surah ${n} has type ${meta.type}`);
  check(int(meta.start, 'sura start') === expectedStart, `surah ${n} start offset mismatch`);

  const ayahTags = [...m[2].matchAll(/<aya\s([^>]*?)\/>/g)].map((t) => attrs(t[1]));
  check(ayahTags.length === int(meta.ayas, 'sura ayas'), `surah ${n} has ${ayahTags.length} ayahs, metadata says ${meta.ayas}`);

  let basmala: string | null = null;
  const ayahs = ayahTags.map((a, j) => {
    check(int(a.index, 'aya index') === j + 1, `${n}:${j + 1} out of order`);
    const text = a.text;
    check(typeof text === 'string' && text.length > 0, `${n}:${j + 1} is empty`);
    // The feed splits very long ayahs at spaces and must be able to rejoin them exactly.
    check(text === text.trim() && !text.includes('  '), `${n}:${j + 1} has irregular spacing`);
    if (a.bismillah !== undefined) {
      check(j === 0, `${n}:${j + 1} has a basmala but is not the first ayah`);
      check(a.bismillah.length > 0, `surah ${n} has an empty basmala`);
      basmala = a.bismillah;
      basmalaForms.set(basmala, [...(basmalaForms.get(basmala) ?? []), n]);
    }
    return text;
  });

  if (n === 1 || n === 9) {
    check(basmala === null, `surah ${n} should not carry a separate basmala`);
  } else {
    check(basmala !== null, `surah ${n} is missing its basmala`);
  }

  ayahTotal += ayahs.length;
  expectedStart += ayahs.length;
  return {
    n,
    name: sa.name,
    nameEn: meta.tname,
    type: meta.type === 'Meccan' ? 'meccan' : 'medinan',
    basmala,
    ayahs,
  };
});

check(surahs.length === TOTAL_SURAHS, `text has ${surahs.length} surahs`);
check(ayahTotal === TOTAL_AYAHS, `text has ${ayahTotal} ayahs`);
check(surahs[0].ayahs[0] === surahs[1].basmala, "Al-Fatiha's first ayah should match Al-Baqarah's basmala");

for (const [s, a] of juz) {
  check(s >= 1 && s <= TOTAL_SURAHS && a >= 1 && a <= surahs[s - 1].ayahs.length, `juz start ${s}:${a} is out of range`);
}

// Sajdah signs in the text must sit exactly on the metadata's sajdah ayahs.
const signAt = new Set<string>();
for (const s of surahs) {
  s.ayahs.forEach((text, j) => {
    const count = text.split(SAJDAH_SIGN).length - 1;
    check(count <= 1, `${s.n}:${j + 1} has ${count} sajdah signs`);
    if (count === 1) signAt.add(`${s.n}:${j + 1}`);
  });
}
const metaAt = new Set(sajdas.map(([s, a]) => `${s}:${a}`));
check(signAt.size === 15, `text has ${signAt.size} sajdah signs`);
for (const key of metaAt) check(signAt.has(key), `sajdah sign missing at ${key}`);

const data = {
  source: {
    name: 'Tanzil Project',
    url: 'https://tanzil.net',
    text: `Tanzil Quran Text (${versionMatch[1]})`,
    downloadOptions: 'quranType=uthmani, pause marks, sajdah signs, superscript alefs, tatweel',
    sha256: { 'quran-uthmani.xml': PINNED_SHA256['quran-uthmani.xml'], 'quran-data.xml': PINNED_SHA256['quran-data.xml'] },
    notice,
  },
  surahs,
  juz,
  sajdas,
};

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(data));

// ---------------------------------------------------------------------------
// Tafsir al-Muyassar (King Fahd Glorious Qur'an Printing Complex), via Tanzil.

const tafsirXml = readPinned('ar.muyassar.xml');
const tafsirNoticeMatch = tafsirXml.match(/<!--([\s\S]*?)-->/);
check(tafsirNoticeMatch, 'Tafsir file header not found');
const tafsirNotice = tafsirNoticeMatch[1].replace(/^\s*\n/, '').replace(/\s+$/, '');
check(tafsirNotice.includes('ar.muyassar'), 'Tafsir file is not ar.muyassar');

const tafsirSurahs = [...tafsirXml.matchAll(/<sura\s([^>]*)>([\s\S]*?)<\/sura>/g)];
check(tafsirSurahs.length === TOTAL_SURAHS, `tafsir has ${tafsirSurahs.length} surahs`);
const tafsir: string[] = [];
tafsirSurahs.forEach((m, i) => {
  check(int(attrs(m[1]).index, 'tafsir sura index') === i + 1, `tafsir surah ${i + 1} out of order`);
  const ayahs = [...m[2].matchAll(/<aya\s([^>]*?)\/>/g)].map((t) => attrs(t[1]));
  check(ayahs.length === surahs[i].ayahs.length, `tafsir surah ${i + 1} has ${ayahs.length} entries, the text has ${surahs[i].ayahs.length}`);
  ayahs.forEach((a, j) => {
    check(int(a.index, 'tafsir aya index') === j + 1, `tafsir ${i + 1}:${j + 1} out of order`);
    check(typeof a.text === 'string' && a.text.trim().length > 0, `tafsir ${i + 1}:${j + 1} is empty`);
    tafsir.push(a.text);
  });
});
check(tafsir.length === TOTAL_AYAHS, `tafsir has ${tafsir.length} entries`);

const tafsirData = {
  source: {
    name: 'التفسير الميسر',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    via: 'Tanzil Project',
    url: 'https://tanzil.net/trans/',
    terms: 'Tanzil translations are for non-commercial use only.',
    sha256: PINNED_SHA256['ar.muyassar.xml'],
    notice: tafsirNotice,
  },
  /** One entry per ayah, in mushaf order (1:1 … 114:6). */
  ayahs: tafsir,
};
writeFileSync(tafsirOutFile, JSON.stringify(tafsirData));
console.log(`✓ tafsir al-Muyassar: ${tafsir.length} entries → ${path.relative(root, tafsirOutFile)} (${Math.round(Buffer.byteLength(JSON.stringify(tafsirData)) / 1024)} KB)`);

// ---------------------------------------------------------------------------
// Riwayat Qalun 'an Nafi' (King Fahd Glorious Qur'an Printing Complex, Uthmanic
// Qaloon data v10), shown in the Complex's own Qaloon font. The words are kept
// exactly; only whitespace is tidied (no-break spaces become plain spaces, runs
// of spaces become one) and the trailing ayah number is dropped, since the app
// draws its own. The Hafs ↔ Qalun ayah mapping comes from risan/quran-json.

const kfgDir = path.join(root, 'data-src', 'kfgqpc');
const QALUN_PINNED: Record<string, string> = {
  'QaloonData_v10.json': '18465c40ebeec40a92eb98745c9b89796ac6e31f6e93988883dfb6602faaea95',
  'risan-qalun.json': 'ece0a2b0efe44d496211c595d0a34f495413bc93f78fba8095a666e2048d1303',
};
function readKfg(name: string): string {
  const buf = readFileSync(path.join(kfgDir, name));
  const hash = createHash('sha256').update(buf).digest('hex');
  check(hash === QALUN_PINNED[name], `${name} has changed (sha256 ${hash}). Review it, then update QALUN_PINNED.`);
  return buf.toString('utf8');
}

const QALUN_TOTAL = 6214;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

type KfgRow = { sura_no: number; aya_no: number; jozz: number; aya_text: string };
const kfg = JSON.parse(readKfg('QaloonData_v10.json')) as KfgRow[];
const risan = JSON.parse(readKfg('risan-qalun.json')) as Record<string, { verse: number; number_in_hafs: number[] }[]>;
check(kfg.length === QALUN_TOTAL, `Qalun text has ${kfg.length} ayahs`);

const qSurahs: (Surah & { hafs: [number, number][] })[] = surahs.map((h) => ({ ...h, basmala: null, ayahs: [], hafs: [] }));
const qJuz: [number, number][] = [];
let lastJuz = 0;
for (const row of kfg) {
  const s = qSurahs[row.sura_no - 1];
  check(s, `Qalun row has surah ${row.sura_no}`);
  check(row.aya_no === s.ayahs.length + 1, `Qalun ${row.sura_no}:${row.aya_no} out of order`);
  const m = row.aya_text.match(/^([\s\S]*?) ([٠-٩]+)$/);
  check(m && m[2] === toArabicDigits(row.aya_no), `Qalun ${row.sura_no}:${row.aya_no} does not end with its number`);
  const text = m[1].replace(/ /g, ' ').replace(/ {2,}/g, ' ').trim();
  check(text.length > 0 && !/[\s]{2}/.test(text), `Qalun ${row.sura_no}:${row.aya_no} has irregular spacing`);
  s.ayahs.push(text);
  if (row.jozz !== lastJuz) {
    check(row.jozz === lastJuz + 1, `Qalun juz ${row.jozz} out of order`);
    qJuz.push([row.sura_no, row.aya_no]);
    lastJuz = row.jozz;
  }
}
check(qJuz.length === 30, `Qalun text has ${qJuz.length} juz`);

// Hafs range each Qalun ayah covers; together they must cover every Hafs ayah.
for (const s of qSurahs) {
  const map = risan[String(s.n)];
  check(map?.length === s.ayahs.length, `mapping for surah ${s.n} has ${map?.length} ayahs, the Qalun text has ${s.ayahs.length}`);
  let next = 1;
  map.forEach((v, j) => {
    check(v.verse === j + 1, `mapping ${s.n}:${j + 1} out of order`);
    const h = v.number_in_hafs;
    const first = h[0];
    const last = h[h.length - 1];
    check(h.every((x, k) => k === 0 || x === h[k - 1] + 1), `mapping ${s.n}:${j + 1} is not a run`);
    check(first === next || first === next - 1, `mapping ${s.n}:${j + 1} leaves a gap`);
    s.hafs.push([first, last]);
    next = last + 1;
  });
  check(next - 1 === surahs[s.n - 1].ayahs.length, `mapping for surah ${s.n} does not reach the last Hafs ayah`);
}

// The basmala as printed in the Qalun text itself (An-Naml 30).
const naml30 = qSurahs[26].ayahs[29];
const basmalaAt = naml30.indexOf('بِسْمِ');
check(basmalaAt >= 0, 'Qalun basmala not found in 27:30');
const qBasmala = naml30.slice(basmalaAt);
check(qBasmala.split(' ').length === 4, `Qalun basmala looks wrong: ${qBasmala}`);
// In Qalun the basmala is not a numbered ayah, so Al-Fatiha gets a header basmala too.
for (const s of qSurahs) s.basmala = s.n === 9 ? null : qBasmala;

const qSajdas: [number, number, string][] = [];
for (const s of qSurahs) {
  s.ayahs.forEach((text, j) => {
    const count = text.split(SAJDAH_SIGN).length - 1;
    check(count <= 1, `Qalun ${s.n}:${j + 1} has ${count} sajdah signs`);
    if (count === 1) qSajdas.push([s.n, j + 1, 'recommended']);
  });
}
check(qSajdas.length === 11, `Qalun text has ${qSajdas.length} sajdah signs`);

const qalunData = {
  source: {
    name: 'مجمع الملك فهد لطباعة المصحف الشريف',
    url: 'https://qurancomplex.gov.sa/techquran/dev/',
    text: 'KFGQPC Qaloon Uthmanic Data v10 (2021-08-08), via github.com/thetruetruth/quran-data-kfgqpc',
    mapping: 'Hafs ayah mapping from github.com/risan/quran-json (Quranpedia), CC BY-SA 4.0',
    sha256: QALUN_PINNED,
  },
  surahs: qSurahs,
  juz: qJuz,
  sajdas: qSajdas,
};
const qalunOutFile = path.join(root, 'assets', 'data', 'quran-qalun.json');
writeFileSync(qalunOutFile, JSON.stringify(qalunData));
console.log(
  `✓ Qalun: ${kfg.length} ayahs, ${qJuz.length} juz, ${qSajdas.length} sajdah positions → ${path.relative(root, qalunOutFile)} (${Math.round(Buffer.byteLength(JSON.stringify(qalunData)) / 1024)} KB)`,
);

const kb = Math.round(Buffer.byteLength(JSON.stringify(data)) / 1024);
console.log(`✓ ${surahs.length} surahs, ${ayahTotal} ayahs, ${juz.length} juz, ${sajdas.length} sajdah positions`);
for (const [form, list] of basmalaForms) {
  console.log(`✓ basmala form used by ${list.length} surah(s)${list.length < 5 ? `: ${list.join(', ')}` : ''}`);
}
console.log(`✓ wrote ${path.relative(root, outFile)} (${kb} KB)`);
