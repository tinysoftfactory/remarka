/**
 * ShakeDetector wraps react-native-shake.
 * The package must be installed and linked if withShake is enabled.
 *
 * Install: npx expo install react-native-shake
 * or:      yarn add react-native-shake && npx pod-install
 */

type UnsubscribeFn = () => void;

export function subscribeToShake(onShake: () => void): UnsubscribeFn {
  let RNShake: { addListener: (cb: () => void) => { remove: () => void } } | null = null;

  try {
    // Dynamic require so that the library stays optional at bundle time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    RNShake = require('react-native-shake').default;
  } catch {
    console.warn(
      '[ReMarka] withShake is enabled but react-native-shake is not installed.\n' +
      'Run: yarn add react-native-shake && npx pod-install',
    );
    return () => {};
  }

  // react-native-shake v6+ API: addListener(callback)
  const subscription = RNShake!.addListener(onShake);
  return () => subscription.remove();
}
