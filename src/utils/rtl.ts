import { I18nManager } from 'react-native';

/**
 * The interface is Arabic, so rows run right to left. The app does not depend on
 * the phone's own layout direction (which needs an app restart to change);
 * instead these helpers give the right-to-left result in either mode.
 */
const nativeRTL = I18nManager.isRTL;

/** Children laid out right to left: the first child sits on the right. */
export const ROW = nativeRTL ? 'row' : 'row-reverse';

/** Align to the right edge (the start of an Arabic line). */
export const ALIGN_START = nativeRTL ? 'flex-start' : 'flex-end';

/** Physical left, whatever the layout direction. */
export function physicalLeft(value: number) {
  return nativeRTL ? { right: value } : { left: value };
}
