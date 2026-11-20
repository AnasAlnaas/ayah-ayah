import type { RefObject } from 'react';
import type { FlatList } from 'react-native';

export type WebPagerOptions = {
  listRef: RefObject<FlatList<unknown> | null>;
  /** Re-attach when the list remounts */
  listKey: string;
  count: number;
  pageHeight: number;
  getActive: () => number;
  enabled: boolean;
};

/**
 * On phones the list pages natively (snapToInterval). The web version
 * (use-web-pager.web.ts) turns wheel, touch and keyboard input into one card
 * per gesture instead.
 */
export function useWebPager(_options: WebPagerOptions): void {}
