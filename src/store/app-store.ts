import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clampPosition } from '@/data/quran';
import type { Position } from '@/feed/build-feed';
import type { Numerals } from '@/utils/arabic';

export type ThemeSetting = 'system' | 'light' | 'dark';

export type Bookmark = { s: number; a: number; at: number };

type Persisted = {
  fontScale: number;
  theme: ThemeSetting;
  numerals: Numerals;
  keepAwake: boolean;
  haptics: boolean;
  /** Where the reader last stopped */
  position: Position;
  /** The swipe hint disappears after the first swipe, for good */
  hintSeen: boolean;
  /** Newest first */
  bookmarks: Bookmark[];
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
};

export type AppState = Persisted & Transient & Actions;

export const DEFAULTS: Persisted = {
  fontScale: 1,
  theme: 'system',
  numerals: 'arabic',
  keepAwake: true,
  haptics: true,
  position: { s: 1, a: 0 },
  hintSeen: false,
  bookmarks: [],
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
    }),
    {
      name: 'ayah-ayah',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ fontScale, theme, numerals, keepAwake, haptics, position, hintSeen, bookmarks }) => ({
        fontScale,
        theme,
        numerals,
        keepAwake,
        haptics,
        position,
        hintSeen,
        bookmarks,
      }),
      merge: (saved, current) => {
        const state = { ...current, ...(saved as Partial<Persisted>) };
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
