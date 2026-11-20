# Qur'an text source

These files are verbatim copies from the [Tanzil Project](https://tanzil.net). Do not edit them.

| File | Downloaded from | sha256 |
| --- | --- | --- |
| `quran-uthmani.xml` | `https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&alef=true&tatweel=true&quranType=uthmani&outType=xml&agree=true` | `8c5aeae20363a98f6963720d29fce040ca8b56a8e75f8b564c257fce7f6d0417` |
| `quran-data.xml` | `https://tanzil.net/res/text/metadata/quran-data.xml` | `8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a` |
| `ar.muyassar.xml` | `https://tanzil.net/trans/?transID=ar.muyassar&type=xml` | `099388626fb53cee121314164b1552140c2805ba4bab79cd181e0748d5756c6d` |

- Text: Tanzil Quran Text, Uthmani, Version 1.1 (Hafs ʿan ʿĀṣim, as in the Madina Mushaf).
- Options: pause marks, sajdah signs (۩), superscript alefs, tatweel below superscript alefs. Rub-el-hizb signs are not included.
- Downloaded: 2026-11-19.

- Tafsir: التفسير الميسر by the King Fahd Glorious Qur'an Printing Complex, as published by Tanzil (last updated there January 7, 2011). Downloaded 2026-11-19.

## Terms of use (Tanzil)

Tafsir and translations from Tanzil are for **non-commercial use only**; any commercial use needs permission from the publisher (the King Fahd Complex). The app is free and has no ads.

Qur'an text:

Verbatim copies are allowed; changing the text is not. The app must clearly credit the Tanzil Project and link to tanzil.net. The full copyright notice is kept at the top of `quran-uthmani.xml`, copied into `assets/data/quran.json`, and shown in the app's About screen.

## Updating

1. Download the new files from the URLs above into this folder.
2. Read Tanzil's change log (https://tanzil.net/updates/) and review the differences.
3. Update `PINNED_SHA256` in `scripts/build-quran-data.mts` and this table.
4. Run `npm run build:data` and `npm test`.
