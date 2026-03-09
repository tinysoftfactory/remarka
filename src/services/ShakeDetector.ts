/**
 * ShakeDetector uses react-native-shake for shake detection.
 * Shake threshold is controlled natively (hardcoded in react-native-shake).
 * The `threshold` parameter is reserved for future use.
 *
 * Install: yarn add react-native-shake && npx pod-install
 */

type UnsubscribeFn = () => void;

export function subscribeToShake(
  onShake: () => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _threshold?: number,
): UnsubscribeFn {
  let RNShake: {
    addListener: (cb: () => void) => { remove: () => void };
  } | null = null;

  try {
    // Dynamic require keeps react-native-shake optional at bundle time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    RNShake = require('react-native-shake').default;
  } catch {
    console.warn(
      '[ReMarka] withShake is enabled but react-native-shake is not installed.\n' +
      'Run: yarn add react-native-shake && npx pod-install',
    );
    return () => {};
  }

  const subscription = RNShake!.addListener(onShake);
  return () => subscription.remove();
}
