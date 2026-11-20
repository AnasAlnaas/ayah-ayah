# آية آية — Build Plan

> **Status:** v1.1 built (web-tested; not yet on a real phone) · **Prototype:** https://claude.ai/artifact/VKTkPVnWb5vQyxcbXUFjdo · **Updated:** 2026-11-19

## How to use this plan

- Edit anything here directly. Change the defaults in **§2**, move features between releases in **§3**, and delete whatever you don't want.
- Items marked **⚑** are choices I made for you. Check those first.
- When you're happy with it, tell me **"start Phase 0"** (or "build v1") and I'll build from this file.

---

## 1. What we're building

**The prototype:** a vertical, full-screen feed of the Qur'an. Each screen shows one ayah, and you swipe up for the next, like a short-video feed but calm. A header card separates each surah. The top bar shows the surah name and "آية ٣ من ٧". A thin gold rail shows progress. It uses parchment colours, the Amiri Quran font, the ayah number in a gold diamond, and a first-run hint, "اسحب للأعلى ↑".

**The app:** the same experience over the whole Qur'an (114 surahs and 6,236 ayahs, so 6,350 cards with the headers). It works offline, remembers where you stopped, and lets you jump anywhere. Later releases add recitation that moves the feed forward by itself, a memorisation repeat mode, translation and tafsir.

**The goal for v1:** you open the app, you're back at your last ayah within a second, and you swipe. Nothing else gets in the way.

---

## 2. Decisions to confirm

| #   | Decision                     | My default ⚑                                                                                                | Alternatives                                                                              |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| D1  | Platform                     | **Expo (React Native) + TypeScript**: one codebase for iOS, Android and a web version                       | PWA only (Vite + React): fastest to ship, no app stores, weaker audio on iOS · Flutter    |
| D2  | App name                     | **آية آية** (store name in English: "Ayah Ayah")                                                            | Your pick                                                                                 |
| D3  | Interface language           | **Arabic only in v1**, with an English interface added alongside translations (v1.3)                        | Bilingual from day one                                                                    |
| D4  | Qur'an text                  | **Tanzil.net Uthmani script (Hafs)**, bundled offline                                                       | Simple/imlāʾī script (the prototype uses it) · KFGQPC Hafs text with its matching font    |
| D5  | Font                         | **Amiri Quran** (as in the prototype)                                                                       | KFGQPC Uthmanic Hafs · let the user choose in settings                                    |
| D6  | Progress rail                | **Progress through the current surah**, with the whole-Qur'an % shown in the index                          | Whole-Qur'an progress (it barely moves: one card is 0.016%)                               |
| D7  | Very long ayahs (e.g. 2:282) | **Shrink the text to fit, down to a minimum size; if it still doesn't fit, the text scrolls inside the card** | Split it across "يتبع" continuation cards · always scroll                                 |
| D8  | Numerals                     | **Eastern Arabic (١٢٣)**                                                                                    | Western (123) · a setting                                                                 |
| D9  | Themes                       | **Parchment (light) + Night (dark), following the system by default**                                       | Add Sepia / high-contrast                                                                 |
| D10 | Accounts & sync              | **None.** Everything stays on the device                                                                    | Optional sign-in to sync across devices (later)                                           |
| D11 | Analytics                    | **None in v1**                                                                                              | Opt-in crash reporting                                                                    |
| D12 | Business model               | **Free, no ads**                                                                                            | Free with a donation link                                                                 |
| D13 | Orientation                  | **Portrait only in v1**; tablets show a centred column                                                      | Landscape support                                                                         |

---

## 3. Scope by release

Move lines between releases however you like.

### v1: the feed (MVP)

- [x] Full Qur'an feed: a header card for each surah plus one card per ayah, with vertical snap paging
- [x] Surah header card: name, number, ayah count with the correct Arabic plural, مكية/مدنية, and the basmala (every surah except At-Tawbah; in Al-Fātiḥa the basmala is ayah 1 and gets its own card)
- [x] Ayah card: the text, the ayah number in its diamond, and a sajdah mark ۩ on the 15 sajdah ayahs
- [x] Top bar: surah name · "آية ٣ من ٧" · juz number. Tapping it opens the index
- [x] Progress rail (see D6)
- [x] Entry animation (fade and rise, as in the prototype), turned off when the phone's "reduce motion" setting is on
- [x] Resume: the app reopens at your last ayah
- [x] Index sheet: Surahs (114) · Juz (30) · Go to surah:ayah
- [x] Settings: text size, theme, numerals, keep screen awake, haptics
- [x] First-run hint, shown until your first swipe
- [x] Works fully offline; an About screen with the Tanzil attribution and licence
- [x] A light haptic tick when you enter a new surah

**Changes made while building v1:**

- **D7, long ayahs:** text shrinks to fit (down to 65% of the chosen size); if that's not enough, the ayah continues on the next card ("يتبع ↓"), cut at a pause mark where possible and never after ۙ. Scrolling inside a card was dropped: on iPhone it can trap your swipe inside that card.
- **Basmala:** stored per surah, because surahs 95 and 97 carry a shadda on the bāʾ in the Madina Mushaf.
- **Text size:** a stepper (80–160%) with a live preview instead of a slider, so it works the same on phones and the web.
- **Separators:** "،" instead of "·", which looked like the Arabic zero (٠) next to numbers.
- **Colours:** muted text and ayah numbers are a shade darker than the prototype so small text passes WCAG AA contrast.
- **Ayah number:** a diamond, as this plan says. (The prototype's CSS actually draws a circle.)
- **Settings:** reached from the index sheet ("الإعدادات").
- **Web:** wheel, arrow keys, Space/Page Down and touch move exactly one card per gesture.

**Still open for v1:** testing on real phones, the human review of the Uthmani text on iOS and Android, and the store builds (they need your Expo, Apple and Google accounts).

### v1.1: home, tafsir, keep & share

Your choices (2026-11-19): **home screen first**, **tafsir stays open as you swipe**, **bookmark from a long-press menu** (no double-tap).

- [x] Home screen: "continue reading" card, your % through the mushaf, shortcuts (surahs, juz, bookmarks, go to), ayah of the day, settings
- [x] Tap an ayah: it glides up and Tafsir al-Muyassar fades in beneath it. Study mode: tafsir stays on for every ayah until you tap again. Long tafsir shows what fits, plus "اقرأ التفسير كاملًا" for the full text in a sheet *(moved here from v1.3)*
- [x] Bookmarks: from the long-press menu or the mark beside the tafsir; bookmarked ayahs get a solid gold number diamond; a bookmarks list in the index (from home or the reader)
- [x] Long-press menu: bookmark, copy (﴿ayah﴾ [surah: number]), share as image
- [x] Share-as-image card: parchment, gold frame, surah title, the ayah and its number; phones use the system share sheet, the web shares or downloads a PNG
- [x] Home button in the reader's top bar

**Changes made while building v1.1:**

- Tapping an ayah used to hide the top bar (focus mode); it now opens tafsir, so focus mode is gone. The bars stay visible.
- Tafsir and bookmarks are bundled, so they work offline. The tafsir (2.5 MB) loads shortly after the reader opens rather than at app start.
- Tafsir licence: Tanzil allows its tafsir and translations for **non-commercial use only**. That fits D12 (free, no ads); a paid version or ads would need permission from the King Fahd Complex.

### v1.2: listen

- [ ] Recitation per ayah. When an ayah finishes, the feed moves to the next one by itself
- [ ] Choice of reciter (start with 3–5)
- [ ] Memorisation mode: repeat each ayah N times, or loop a range
- [ ] Background playback and lock-screen controls
- [ ] Download a surah for offline listening

### v1.3: understand

- [ ] Translation under the ayah (toggle), English first
- [x] ~~Tafsir al-Muyassar~~ (done in v1.1)
- [ ] English interface

### Later

- [ ] Daily goal and streak, ayahs-read stats
- [ ] Khatmah planner (finish in N days)
- [ ] Reminder notifications
- [ ] Search (Arabic, ignoring diacritics)
- [ ] Word-by-word meanings
- [ ] Home-screen widget: ayah of the day
- [ ] Optional account and sync

---

## 4. Screens and interactions

### 4.1 Feed (home)

Layout, right to left and top to bottom:

- **Top bar** over the content, fading out at its lower edge: the surah name in bold on the right, and "آية ٣ من ٧ · الجزء ١" on the left.
- **The card** fills the screen. The text is centred, with the ayah-number diamond below it.
- **Progress rail** on the left edge, as in the prototype.
- **Hint** at the bottom, on first run only.

| Gesture           | Action                                       |
| ----------------- | -------------------------------------------- |
| Swipe up / down   | Next / previous card                         |
| Tap the top bar   | Open the index                               |
| Tap the card      | Hide or show the top bar and rail (focus mode) |
| Double-tap        | Bookmark (v1.1)                              |
| Long-press        | Action menu (v1.1)                           |

**Header card:** the framed label "سُورَةُ البقرة", then "٢٨٦ آية · مدنية" below it, then the basmala.

### 4.2 Index sheet

A bottom sheet with three tabs: **السور · الأجزاء · انتقال**

- **Surah row:** number, name, ayah count, مكية/مدنية. The current surah is highlighted.
- **Juz row:** juz number and where it starts (surah:ayah).
- **Go to:** a surah picker and an ayah-number field that checks the number is in range.
- **Footer:** where you are in the whole Qur'an, e.g. "موضعك: ١٢٪ من المصحف".

### 4.3 Settings

- حجم الخط: a slider with a live preview of an ayah
- المظهر: تلقائي / فاتح / داكن
- الأرقام: ١٢٣ / 123
- إبقاء الشاشة مضاءة
- الاهتزاز
- عن التطبيق

### 4.4 About

The app version, the text source and its licence (Tanzil), the font licence (SIL OFL), a privacy statement ("no data leaves your device") and a contact address.

### 4.5 First run

There are no onboarding screens. The app opens on the Al-Fātiḥa header card with the swipe hint.

---

## 5. Qur'an data and licensing

- **Text:** Tanzil's Uthmani script (Hafs ʿan ʿĀṣim), XML download. The licence allows verbatim copies with attribution, and the text must not be changed. **We never type or edit Qur'an text by hand.** It only ever comes from the downloaded file.
- **Metadata:** Tanzil's quran-data file: surah names, ayah counts, Makki/Madani, where each juz and hizb starts, sajdah positions, and page numbers.
- **Basmala:** in Tanzil's XML the basmala is a separate attribute on ayah 1, so it goes on the header card rather than into ayah 1. The build script checks this instead of assuming it. Al-Fātiḥa's basmala stays as ayah 1, and At-Tawbah has none.
- **Build script** (`scripts/build-quran-data.ts`): converts the files once into `assets/quran.json` (about 1.5 MB). It checks that there are 114 surahs and 6,236 ayahs and that each surah's count matches the metadata. It also records a checksum of the source file so any change is caught.
- **Audio (v1.2):** EveryAyah.com per-ayah MP3s or the Quran Foundation API. Each reciter's terms need confirming before release.
- **Translation and tafsir (v1.3):** licences vary by translation (Saheeh International, for example, is copyrighted). We'll pick ones we're allowed to bundle or stream when we get to v1.3.

---

## 6. Technical plan

### Stack

| Purpose            | Choice                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| App framework      | Expo (latest SDK), TypeScript, Expo Router                                        |
| Feed list          | FlatList with paging and a fixed item height (the screen height), so jumps are instant. Switch to FlashList if profiling calls for it |
| Animation          | Reanimated                                                                        |
| State              | Zustand, saved to AsyncStorage (this keeps the app testable in Expo Go)           |
| Fonts              | expo-font                                                                         |
| Small modules      | expo-haptics, expo-keep-awake, @gorhom/bottom-sheet                               |
| v1.1               | react-native-view-shot for share images                                           |
| v1.2               | expo-audio                                                                        |
| Builds & release   | EAS Build / Submit. The web version is an Expo web export hosted on EAS Hosting or Vercel |

> You're on Windows. That's fine: iOS builds run in EAS's cloud, so no Mac is needed. Publishing needs an Apple Developer account ($99/year) and a Google Play developer account ($25 one-time).

### Folder layout

```
app/                    Expo Router screens
  _layout.tsx           fonts, theme, RTL, providers
  index.tsx             the feed
  settings.tsx
  about.tsx
src/
  data/                 quran.json loader, surah/juz metadata
  feed/                 buildFeed.ts, Feed.tsx, AyahCard.tsx, SurahHeaderCard.tsx
  ui/                   TopBar.tsx, ProgressRail.tsx, SwipeHint.tsx, IndexSheet.tsx
  store/                settings.ts, position.ts (Zustand + persistence)
  lib/                  arabicDigits.ts, ayahCountLabel.ts, fitText.ts
  theme/                tokens.ts
scripts/
  build-quran-data.ts
assets/
  fonts/  quran.json  icon.png  splash.png
```

### Data model

```ts
type Surah = {
  n: number;               // 1–114
  name: string;            // "البقرة"
  nameEn: string;          // "Al-Baqarah"
  type: 'meccan' | 'medinan';
  basmala: boolean;        // false for 1 (it's ayah 1) and 9
  ayahs: string[];
};

type FeedItem =
  | { kind: 'header'; s: number }
  | { kind: 'ayah'; s: number; a: number };

// Built once at startup: feed (6,350 items) + surahStart[s] → index, for instant jumps.
type Position = { s: number; a: number };   // a = 0 means the header card
type Settings = { fontScale: number; theme: 'system' | 'light' | 'dark';
                  numerals: 'arabic' | 'western'; keepAwake: boolean; haptics: boolean };
type Bookmark = { s: number; a: number; at: number };   // v1.1
```

The position is saved as surah:ayah, not as a list index, so it stays valid if the feed's layout changes.

### Key pieces

1. **Feed builder:** a header card, then the ayah cards, for each surah.
2. **Active-card tracking:** a card counts as current when 60% of it is visible (the same threshold as the prototype). The current card drives the top bar and the rail, and the position is saved with a short delay.
3. **Text fitting (D7):** measure the text, step the font size down until it fits the card, and stop at 60% of the chosen size. If it still overflows, the text scrolls inside the card with a small "↓" cue. The chosen size is cached per ayah for each screen size and font setting.
4. **Arabic helpers:** `toArabicDigits()` and `ayahCountLabel(n)`: آية واحدة، آيتان، ٣–١٠ آيات، ١١ and above آية. For counts over 100 the last two digits decide, so ١١٠ آيات، ٢٠٦ آيات، ٢٨٦ آية.
5. **RTL:** the app forces right-to-left layout at launch, since the interface is Arabic only.
6. **Performance:** render only a few cards either side of the current one, memoise the cards, and use no images. The target is 60 fps on a mid-range Android phone.

---

## 7. Design

The app keeps the prototype's look.

| Token             | Parchment (light) | Night (dark) ⚑ |
| ----------------- | ----------------- | -------------- |
| Background        | `#f6f0e4`         | `#14120f`      |
| Ayah text         | `#2a2116`         | `#ece3d2`      |
| Top-bar text      | `#5b4a32`         | `#c9b896`      |
| Gold (ornaments)  | `#b08d57`         | `#c9a46a`      |
| Deep gold (numbers) | `#8a6a3a`       | `#d9b77d`      |
| Muted text        | `#9a8566`         | `#8f7f63`      |
| Rail track        | `#e4d9c4`         | `#2b261f`      |

The night colours are my proposal. I'll tune them for contrast.

- **Type:** ayahs in Amiri Quran at 31 px with a line height of 2.3 by default (the user can scale it from 0.8× to 1.6×). The interface uses Noto Naskh Arabic at 13–17 px.
- **Ornaments:** the ayah number in a rotated square, and the framed surah label, both as in the prototype.
- **App icon:** a gold diamond with "آية" on parchment, drafted in Phase 4.
- **Motion:** a 0.6 s fade-and-rise when a card enters, and a gentle bounce on the hint. Nothing else moves.

---

## 8. Build phases

Each phase ends with something you can open and try.

### Phase 0: Project setup

- Create the Expo app (TypeScript, Expo Router) in this folder, and set up git
- Fonts, theme tokens, RTL, linting and formatting, a test runner

**Done when:** the app runs on your phone through Expo Go and in a browser, showing one styled placeholder card.

### Phase 1: Qur'an data

- Download the Tanzil text and metadata (a pinned version), then write the build script, validation and unit tests

**Done when:** `assets/quran.json` builds, every check passes, and the About screen credits Tanzil.

### Phase 2: The feed

- Feed builder, header and ayah cards, the paging list, top bar, rail, entry animation, hint, text fitting and the Arabic helpers

**Done when:** you can swipe smoothly from Al-Fātiḥa to An-Nās, 2:282 is readable, and the top bar is always correct.

### Phase 3: Navigation & memory

- Resume, the index sheet (surahs, juz, go to), settings with saving, themes, keep-awake, haptics

**Done when:** closing and reopening the app returns you to the same ayah, and any ayah is reachable in three taps or fewer.

### Phase 4: Polish & ship v1

- An accessibility pass (screen-reader labels, reduce motion, contrast), the icon and splash screen, checks on small screens and tablets, the About screen and privacy policy, store listings, EAS builds to TestFlight and Play internal testing, and the web deploy

**Done when:** you've installed it from a TestFlight or Play test link on real devices.

### Phase 5 onward

v1.1, v1.2 and v1.3 as listed in §3, each planned in detail when we reach it.

---

## 9. Testing

- **Unit tests:** data checks (counts, basmala rules, sajdah positions), the numeral and plural helpers, the feed builder, and the mapping between position and list index
- **Device checklist:** an iPhone SE-size screen, a large iPhone, a low-end Android phone, an iPad; light and dark; the largest font; long ayahs (2:282, 2:102, 24:31, 73:20); one-word ayahs (طه، يس); resuming after a force-quit; jumping to 114:6 and back to 1:1
- **Text review:** before release, someone who reads the Qur'an fluently checks that the Uthmani marks display correctly on both iOS and Android

---

## 10. Risks and open questions

| Risk                                                               | How we handle it                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| An error in the Qur'an text                                        | One verified source, a checksum, no hand edits, and the human review above |
| Uthmani marks display differently on Android and iOS with Amiri Quran | Check early in Phase 2; the fallback is the KFGQPC font                 |
| Long-ayah handling feels wrong                                     | Try it on a real phone in Phase 2, and switch to a D7 alternative if needed |
| App store review                                                   | Religious content is allowed; we need a privacy policy (no data collected) and the attributions |
| Audio (v1.2) and translation (v1.3) licences                       | Settle these before building each release                               |

**Open questions for you:**

1. Do you want Madani mushaf page numbers shown (e.g. "ص ٢٣") in the top bar?
2. On first run, should the app offer a "ابدأ من" choice (Al-Fātiḥa / a surah you pick), or always start at Al-Fātiḥa?
3. Will you test on iPhone, Android, or both?
