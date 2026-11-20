import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { SHARE_CARD_RATIO } from '@/components/share-card';

export type ShareImageRequest = {
  /** The on-screen ShareCard to capture (phones) */
  cardRef: RefObject<HostInstance | null>;
  s: number;
  a: number;
  surahName: string;
};

export type ShareResult = 'shared' | 'downloaded' | 'unavailable';

/** Phones: capture the preview card as a PNG and open the system share sheet. */
export async function shareAyahImage({ cardRef, surahName, a }: ShareImageRequest): Promise<ShareResult> {
  if (!cardRef.current || !(await Sharing.isAvailableAsync())) return 'unavailable';
  const uri = await captureRef(cardRef as never, {
    format: 'png',
    quality: 1,
    width: 1080,
    height: Math.round(1080 * SHARE_CARD_RATIO),
    result: 'tmpfile',
  });
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: `سورة ${surahName}، الآية ${a}`,
  });
  return 'shared';
}
