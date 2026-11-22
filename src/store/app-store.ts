import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clampPosition, convertAyah, type Riwayah, setActiveRiwayah } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import type { Numerals } from '@/utils/arabic';
import { dayNumber, type DayLog, pruneLog } from '@/utils/streak';

export type ThemeSetting = 'system' | 'light' | 'dark';

export type Bookmark = { s: number; a: number; at: number };

type Persisted = {
  fontScale: number;
  theme: ThemeSetting;
  numerals: Numerals;
  keepAwake: boolean;
  haptics: boolean;
  /** Which riwayah the mushaf text follows. Position and bookmarks use its numbering. */
  riwayah: Riwayah;
  /** Where the reader last stopped */
  position: Position;
  /** The swipe hint disappears after the first swipe, for good */
  hintSeen: boolean;
  /** Newest first */
  bookmarks: Bookmark[];
  /** Ayahs to read each day */
  dailyGoal: number;
  /** Ayahs read per local day number */
  readLog: DayLog;
  /** Today's day number and the global ayah indices already counted today */
  readToday: { day: number; ayahs: number[] };
};

type Transient = {
  /** A jump requested from the index; the reader consumes it and clears it */
  jump: (Position & { id: number }) | null;
  /** Study mode: tafsir shows under every ayah until tapped off */
  tafsirOpen: boolean;
};

type Actions = {
  set: (patch: Partial<Persisted & Transient>) => void;
  setPosition: (position: Position) => void;
  jumpTo: (position: Position) => void;
  clearJump: () => void;
  /** Returns true when the ayah is now bookmarked */
  toggleBookmark: (s: number, a: number) => boolean;
  removeBookmark: (s: number, a: number) => void;
  /** Counts an ayah as read today (once per day). Returns true when this read completes the goal. */
  recordRead: (globalIndex: number) => boolean;
  /** Switches the text and moves the position and bookmarks to the new numbering. */
  setRiwayah: (riwayah: Riwayah) => void;
};

export type AppState = Persisted & Transient & Actions;

export const DEFAULTS: Persisted = {
  fontScale: 1,
  theme: 'system',
  numerals: 'arabic',
  keepAwake: true,
  haptics: true,
  riwayah: 'hafs',
  position: { s: 1, a: 0 },
  hintSeen: false,
  bookmarks: [],
  dailyGoal: 20,
  readLog: {},
  readToday: { day: 0, ayahs: [] },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      jump: null,
      tafsirOpen: false,
      set: (patch) => set(patch),
      setPosition: (position) => set({ position }),
      jumpTo: (position) => {
        const target = clampPosition(position.s, position.a);
        // Save it right away too, so the reader opens there even if it mounts afterwards.
        set({ position: target, jump: { ...target, id: Date.now() } });
      },
      clearJump: () => set({ jump: null }),
      toggleBookmark: (s, a) => {
        const { bookmarks } = get();
        if (bookmarks.some((b) => b.s === s && b.a === a)) {
          set({ bookmarks: bookmarks.filter((b) => !(b.s === s && b.a === a)) });
          return false;
        }
        set({ bookmarks: [{ s, a, at: Date.now() }, ...bookmarks] });
        return true;
      },
      removeBookmark: (s, a) => set({ bookmarks: get().bookmarks.filter((b) => !(b.s === s && b.a === a)) }),
      recordRead: (globalIndex) => {
        const { readToday, readLog, dailyGoal } = get();
        const day = dayNumber();
        const ayahs = readToday.day === day ? readToday.ayahs : [];
        if (ayahs.includes(globalIndex)) return false;
        const count = ayahs.length + 1;
        set({
          readToday: { day, ayahs: [...ayahs, globalIndex] },
          readLog: pruneLog({ ...readLog, [day]: count }, day),
        });
        return count === dailyGoal;
      },
      setRiwayah: (riwayah) => {
        const { riwayah: from, position, bookmarks, readToday } = get();
        if (riwayah === from) return;
        const move = (s: number, a: number) => ({ s, a: convertAyah(s, a, from, riwayah) });
        const today = readToday.ayahs.length;
        setActiveRiwayah(riwayah);
        const seen = new Set<number>();
        const moved = bookmarks
          .map((b) => ({ ...b, ...move(b.s, b.a) }))
          .filter((b) => !seen.has(b.s * 1000 + b.a) && seen.add(b.s * 1000 + b.a));
        set({
          riwayah,
          position: move(position.s, position.a),
          bookmarks: moved,
          // Today's count is kept; the ayahs already counted can't be matched one to one, so
          // they are dropped and only the count carries over.
          readToday: { day: readToday.day, ayahs: Array.from({ length: today }, (_, i) => -1 - i) },
          jump: null,
          tafsirOpen: false,
        });
      },
    }),
    {
      name: 'ayah-ayah',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ fontScale, theme, numerals, keepAwake, haptics, riwayah, position, hintSeen, bookmarks, dailyGoal, readLog, readToday }) => ({
        fontScale,
        theme,
        numerals,
        keepAwake,
        haptics,
        riwayah,
        position,
        hintSeen,
        bookmarks,
        dailyGoal,
        readLog,
        readToday,
      }),
      merge: (saved, current) => {
        const state = { ...current, ...(saved as Partial<Persisted>) };
        state.riwayah = state.riwayah === 'qalun' ? 'qalun' : 'hafs';
        setActiveRiwayah(state.riwayah);
        state.position = clampPosition(state.position?.s ?? 1, state.position?.a ?? 0);
        state.bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
        return state;
      },
    },
  ),
);

export function bookmarkKey(s: number, a: number): number {
  return s * 1000 + a;
}

export function useBookmarkKeys(): Set<number> {
  const bookmarks = useAppStore((st) => st.bookmarks);
  return useMemo(() => new Set(bookmarks.map((b) => bookmarkKey(b.s, b.a))), [bookmarks]);
}
