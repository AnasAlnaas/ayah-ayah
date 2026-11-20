import { useEffect, useRef } from 'react';

import type { WebPagerOptions } from './use-web-pager';

/** One wheel "burst" (a flick, or trackpad inertia) moves one card. */
const WHEEL_IDLE_MS = 180;
const WHEEL_MIN_DELTA = 12;
/** A touch drag past this share of the card, or a quick flick, turns the page. */
const DRAG_THRESHOLD = 0.15;
const FLICK_VELOCITY = 0.35; // px per ms

/**
 * The browser does not page a virtualised list reliably with CSS scroll-snap
 * (cards far away are not rendered yet, so there is nothing to snap to). Instead
 * the list's own scrolling is turned off and every gesture moves exactly one card.
 */
export function useWebPager({ listRef, listKey, count, pageHeight, getActive, enabled }: WebPagerOptions): void {
  const target = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const list = listRef.current as unknown as {
      getScrollableNode?: () => HTMLElement;
      scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
    } | null;
    const el = list?.getScrollableNode?.();
    if (!list || !el) return;

    const clamp = (i: number) => Math.min(Math.max(i, 0), count - 1);

    const goTo = (index: number) => {
      const next = clamp(index);
      target.current = next;
      // react-native-web replaces the node's own scrollTo, so go through the list.
      list.scrollToOffset({ offset: next * pageHeight, animated: true });
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => (target.current = null), 700);
    };
    const step = (dir: 1 | -1) => goTo((target.current ?? getActive()) + dir);

    // Wheel and trackpad
    let wheelBurst = false;
    let wheelIdle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      e.preventDefault();
      if (!wheelBurst && Math.abs(e.deltaY) >= WHEEL_MIN_DELTA) {
        wheelBurst = true;
        step(e.deltaY > 0 ? 1 : -1);
      }
      if (wheelIdle) clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => (wheelBurst = false), WHEEL_IDLE_MS);
    };

    // Touch: the card follows the finger, then settles on a page.
    let startY = 0;
    let startTop = 0;
    let startTime = 0;
    let startIndex = 0;
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startY = lastY = e.touches[0].clientY;
      startTop = el.scrollTop;
      startTime = performance.now();
      startIndex = Math.round(startTop / pageHeight);
      target.current = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      lastY = e.touches[0].clientY;
      el.scrollTop = startTop + (startY - lastY);
    };
    const onTouchEnd = () => {
      const moved = startY - lastY;
      if (Math.abs(moved) < 4) return; // a tap
      const velocity = moved / Math.max(1, performance.now() - startTime);
      let dir = 0;
      if (moved > pageHeight * DRAG_THRESHOLD || velocity > FLICK_VELOCITY) dir = 1;
      else if (moved < -pageHeight * DRAG_THRESHOLD || velocity < -FLICK_VELOCITY) dir = -1;
      goTo(startIndex + dir);
    };

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.altKey || e.metaKey || e.ctrlKey) return;
      const forward = ['ArrowDown', 'PageDown', 'j'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
      const back = ['ArrowUp', 'PageUp', 'k'].includes(e.key) || (e.key === ' ' && e.shiftKey);
      if (forward || back) {
        e.preventDefault();
        step(forward ? 1 : -1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(count - 1);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      if (wheelIdle) clearTimeout(wheelIdle);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [listRef, listKey, count, pageHeight, getActive, enabled]);
}
