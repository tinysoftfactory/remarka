/**
 * ScreenshotService wraps react-native-view-shot.
 * The package must be installed and linked if withScreenshot is enabled.
 *
 * Install: npx expo install react-native-view-shot
 * or:      yarn add react-native-view-shot && npx pod-install
 */

import { RefObject } from 'react';
import { View } from 'react-native';

export async function captureScreenshot(
  viewRef?: RefObject<View>,
): Promise<string | null> {
  let captureScreen: ((options?: Record<string, unknown>) => Promise<string>) | null = null;
  let captureRef: ((ref: RefObject<View>, options?: Record<string, unknown>) => Promise<string>) | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viewShot = require('react-native-view-shot');
    captureScreen = viewShot.captureScreen;
    captureRef = viewShot.captureRef;
  } catch {
    console.warn(
      '[ReMarka] withScreenshot is enabled but react-native-view-shot is not installed.\n' +
      'Run: yarn add react-native-view-shot && npx pod-install',
    );
    return null;
  }

  try {
    const options = { format: 'jpg', quality: 0.7 };

    if (viewRef?.current && captureRef) {
      return await captureRef(viewRef, options);
    }

    if (captureScreen) {
      return await captureScreen(options);
    }

    return null;
  } catch (error) {
    console.warn('[ReMarka] Screenshot capture failed:', error);
    return null;
  }
}
