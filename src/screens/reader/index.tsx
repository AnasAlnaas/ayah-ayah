import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast, useToast } from '@/components/toast';
import { getSurah, globalAyahIndex, juzOf } from '@/data/quran';
import { loadTafsir, tafsirFor, useTafsir } from '@/data/tafsir';
import {
  type AyahItem,
  buildFeed,
  type Feed,
  type FeedItem,
  indexOfPosition,
  positionOfItem,
  surahProgress,
} from '@/feed/build-feed';
import { bookmarkKey, useAppStore, useBookmarkKeys } from '@/store/app-store';
import { useTheme } from '@/theme';
import { formatNumber } from '@/utils/arabic';

import { AyahActions } from './ayah-actions';
import { AyahCard } from './ayah-card';
import { type CardLayout, cardLayout, makeSplitter } from './card-layout';
import { ProgressRail } from './progress-rail';
import { SurahCard } from './surah-card';
import { SwipeHint } from './swipe-hint';
import { TopBar } from './top-bar';
import { useWebPager } from './use-web-pager';

const isWeb = Platform.OS === 'web';
/** Time an ayah must stay on screen to count as read. */
const READ_AFTER_MS = 3000;
const OPEN_TIMING = { duration: 560, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const CLOSE_TIMING = { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) };

/**
 * Measures the screen, works out how ayahs are split for it, and shows the feed.
 * A new size or text size remounts the feed, which reopens at the saved position.
 */
export function Reader() {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const fontScale = useAppStore((s) => s.fontScale);
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport((v) => (v && Math.abs(v.width - width) < 1 && Math.abs(v.height - height) < 1 ? v : { width, height }));
  };

  const layout = useMemo(
    () => (viewport ? cardLayout(viewport.width, viewport.height, insets, fontScale) : null),
    [viewport, insets, fontScale],
  );
  const splitKey = layout?.key;
  const feed = useMemo(
    () => (layout ? buildFeed(makeSplitter(layout)) : null),
    // Rebuild only when the split could change, not for every new layout object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [splitKey],
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]} onLayout={onLayout}>
      {layout && feed && <FeedView key={`${layout.key}|${layout.height}`} layout={layout} feed={feed} />}
    </View>
  );
}

function FeedView({ layout, feed }: { layout: CardLayout; feed: Feed }) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();
  const numerals = useAppStore((s) => s.numerals);
  const haptics = useAppStore((s) => s.haptics);
  const hintSeen = useAppStore((s) => s.hintSeen);
  const keepAwake = useAppStore((s) => s.keepAwake);
  const fontScale = useAppStore((s) => s.fontScale);
  const tafsirOpen = useAppStore((s) => s.tafsirOpen);
  const bookmarkKeys = useBookmarkKeys();
  const tafsirData = useTafsir();
  const isFocused = useIsFocused();
  const toast = useToast();
  const { show: showToast } = toast;

  // Open where the reader last stopped.
  const [initialIndex] = useState(() => indexOfPosition(feed, useAppStore.getState().position));
  const listRef = useRef<FlatList<FeedItem>>(null);
  const activeRef = useRef(initialIndex);
  /** The card the reader arrived on; moving away from it counts as a swipe. */
  const startRef = useRef(initialIndex);
  const active = useSharedValue(initialIndex);
  const tafsir = useSharedValue(useAppStore.getState().tafsirOpen ? 1 : 0);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [actionsFor, setActionsFor] = useState<{ s: number; a: number } | null>(null);

  // Have the tafsir ready before the first tap.
  useEffect(() => {
    const timer = setTimeout(() => loadTafsir().catch(() => {}), 1200);
    return () => clearTimeout(timer);
  }, []);

  // An ayah counts towards today's goal after 3 seconds on screen.
  useEffect(() => {
    const item = feed.items[activeIndex];
    if (!item || item.kind !== 'ayah' || !isFocused) return;
    const timer = setTimeout(() => {
      const completed = useAppStore.getState().recordRead(globalAyahIndex(item.s, item.a));
      if (completed) {
        showToast('ما شاء الله، أتممت وِرد اليوم');
        if (haptics && !isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }, READ_AFTER_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, feed, isFocused, haptics, showToast]);

  // The glide between reading and tafsir.
  useEffect(() => {
    tafsir.set(withTiming(tafsirOpen ? 1 : 0, tafsirOpen ? OPEN_TIMING : CLOSE_TIMING));
  }, [tafsirOpen, tafsir]);

  // Keep the screen on while reading, if asked to.
  useEffect(() => {
    if (!keepAwake || !isFocused) return;
    const tag = 'reader';
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      Promise.resolve(deactivateKeepAwake(tag)).catch(() => {});
    };
  }, [keepAwake, isFocused]);

  const setActive = useCallback(
    (index: number) => {
      if (index === activeRef.current) return;
      const previous = feed.items[activeRef.current];
      const item = feed.items[index];
      activeRef.current = index;
      active.set(index);
      setActiveIndex(index);

      const store = useAppStore.getState();
      store.setPosition(positionOfItem(item));
      if (!store.hintSeen && index !== startRef.current) store.set({ hintSeen: true });
      if (haptics && !isWeb && previous && previous.s !== item.s) {
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [feed, active, haptics],
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / layout.height);
    setActive(Math.min(Math.max(index, 0), feed.items.length - 1));
  };

  // Jumps from the index sheet arrive through the store.
  useEffect(() => {
    useAppStore.getState().clearJump(); // already applied: the jump also saved the position we opened at
    return useAppStore.subscribe((state, prev) => {
      const jump = state.jump;
      if (!jump || jump === prev.jump) return;
      const index = indexOfPosition(feed, jump);
      listRef.current?.scrollToIndex({ index, animated: false });
      startRef.current = index;
      activeRef.current = -1; // refresh the top bar and rail even when it is the same card
      setActive(index);
      useAppStore.getState().clearJump();
    });
  }, [feed, setActive]);

  const getActive = useCallback(() => activeRef.current, []);
  useWebPager({
    listRef: listRef as never,
    listKey: layout.key,
    count: feed.items.length,
    pageHeight: layout.height,
    getActive,
    enabled: isWeb && isFocused && actionsFor === null,
  });

  const toggleTafsir = useCallback(() => {
    const store = useAppStore.getState();
    store.set({ tafsirOpen: !store.tafsirOpen });
  }, []);

  const openActions = useCallback(
    (item: AyahItem) => {
      if (haptics && !isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActionsFor({ s: item.s, a: item.a });
    },
    [haptics],
  );

  const toggleBookmark = useCallback(
    (item: AyahItem) => {
      const now = useAppStore.getState().toggleBookmark(item.s, item.a);
      if (haptics && !isWeb) Haptics.selectionAsync().catch(() => {});
      showToast(now ? 'حُفظت الآية في المحفوظات' : 'أُزيلت الآية من المحفوظات');
    },
    [haptics, showToast],
  );

  const openFullTafsir = useCallback((item: AyahItem) => {
    router.push({ pathname: '/tafsir', params: { s: String(item.s), a: String(item.a) } });
  }, []);

  const renderItem: ListRenderItem<FeedItem> = ({ item, index }) =>
    item.kind === 'header' ? (
      <SurahCard item={item} index={index} active={active} layout={layout} palette={palette} numerals={numerals} />
    ) : (
      <AyahCard
        item={item}
        index={index}
        active={active}
        tafsir={tafsir}
        tafsirOpen={tafsirOpen}
        tafsirText={tafsirData ? tafsirFor(tafsirData, item.s, item.a) : null}
        bookmarked={bookmarkKeys.has(bookmarkKey(item.s, item.a))}
        layout={layout}
        fontScale={fontScale}
        palette={palette}
        numerals={numerals}
        onPress={toggleTafsir}
        onLongPress={openActions}
        onToggleBookmark={toggleBookmark}
        onMoreTafsir={openFullTafsir}
      />
    );

  const current = feed.items[activeIndex];
  const surah = getSurah(current.s);
  const juz = juzOf(current.s, current.kind === 'ayah' ? current.a : 1);
  const juzText = `الجزء ${formatNumber(juz, numerals)}`;
  const detail =
    current.kind === 'ayah'
      ? `آية ${formatNumber(current.a, numerals)} من ${formatNumber(surah.ayahs.length, numerals)}، ${juzText}`
      : juzText;

  return (
    <>
      <FlatList
        ref={listRef}
        data={feed.items}
        extraData={[palette, tafsirOpen, tafsirData, bookmarkKeys, numerals]}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({ length: layout.height, offset: layout.height * index, index })}
        initialScrollIndex={initialIndex}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // Phones: one card per swipe, however fast. Web: see useWebPager.
        scrollEnabled={!isWeb}
        snapToInterval={isWeb ? undefined : layout.height}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        windowSize={5}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={Platform.OS === 'android'}
        accessibilityLabel="آيات القرآن"
      />
      <TopBar
        title={surah.name}
        detail={detail}
        topInset={insets.top}
        columnWidth={layout.columnWidth}
        palette={palette}
        onOpenIndex={() => router.push('/navigate')}
        onHome={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <ProgressRail
        progress={surahProgress(feed, activeIndex)}
        visible
        left={layout.columnLeft + 10}
        top={insets.top + 90}
        bottom={insets.bottom + 90}
        palette={palette}
      />
      {!hintSeen && <SwipeHint bottom={insets.bottom + 18} palette={palette} />}
      <Toast message={toast.message} bottom={insets.bottom + 56} palette={palette} />
      <AyahActions
        target={actionsFor}
        palette={palette}
        numerals={numerals}
        bookmarked={actionsFor ? bookmarkKeys.has(bookmarkKey(actionsFor.s, actionsFor.a)) : false}
        onClose={() => setActionsFor(null)}
        onToast={showToast}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
