# آية آية (Ayah Ayah)

The Qur'an as a vertical feed: one ayah per screen, swipe up for the next. Tap an ayah for Tafsir al-Muyassar under it; long-press to bookmark, copy or share it as an image. Works offline, remembers where you stopped, and runs on iOS, Android and the web from one Expo codebase.

The plan, decisions and roadmap are in [PLAN.md](PLAN.md).

## Run it

```bash
npm install
npx expo start          # then press w for the browser, or scan the QR code with Expo Go
```

- **Phone:** install Expo Go, scan the QR code from `npx expo start`. Everything in v1 runs in Expo Go.
- **Browser:** `npm run web`. Wheel, arrow keys, Space/Page Down and touch all move one card at a time.

## Checks

```bash
npm test                # data integrity, splitting, feed, Arabic helpers
npm run typecheck
npx expo lint
```

## The Qur'an text and tafsir

The text is Tanzil's Uthmani script (Hafs), copied verbatim. Tafsir al-Muyassar (King Fahd Complex) also comes from Tanzil, whose terms allow it for non-commercial use only. The source files are pinned in `data-src/tanzil/` (see its README for URLs, options and checksums). `assets/data/quran.json` and `assets/data/tafsir-muyassar.json` are generated from them:

```bash
npm run build:data
```

The build stops if anything is off: surah or ayah counts, basmala placement, sajdah signs, or a changed source file. The tests also confirm that every ayah in the app matches the XML character for character. Never edit the text by hand.

## How it's built

| Path | What |
| --- | --- |
| `src/app/` | Routes: home (`index`), the reader (`read`), the index sheet (`navigate`), `tafsir`, `settings`, `about` |
| `src/screens/home/` | Home: continue reading, progress, shortcuts, ayah of the day |
| `src/screens/reader/` | The feed, cards, tafsir panel, long-press menu, top bar, progress rail, text fitting, web paging |
| `src/screens/navigate/` | Surah list, juz list, bookmarks, go-to form |
| `src/components/share-card.tsx` | The share image (drawn on a canvas on the web: `src/utils/share-image.web.ts`) |
| `src/feed/build-feed.ts` | Turns the Qur'an into the list of cards |
| `src/utils/split-ayah.ts` | Splits very long ayahs across cards, preferably at pause marks |
| `src/store/app-store.ts` | Settings, reading position and bookmarks, saved on the device |
| `src/data/tafsir.ts` | Loads Tafsir al-Muyassar on first use |
| `src/theme.ts` | Colours, fonts, sizes |

Long ayahs first shrink to fit (down to 65% of the chosen size). If that is still not enough, the ayah continues on the next card, the way a mushaf continues on the next page. Cuts fall between words, preferably after a pause mark, never after ۙ, and the parts rejoin to the exact original text.

## Release

Builds run in Expo's cloud, so no Mac is needed for iOS.

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # links the project to your Expo account
npx eas-cli@latest build -p android --profile preview      # installable APK for testing
npx eas-cli@latest build -p ios --profile production       # then: eas submit -p ios
npx expo export -p web                  # static site in dist/, host anywhere
```

Before publishing, change `ios.bundleIdentifier` and `android.package` in `app.json` (currently `com.ayahayah.app`) to identifiers you own.
