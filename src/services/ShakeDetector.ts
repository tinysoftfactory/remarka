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
  try {
    // Dynamic require keeps react-native-shake optional at bundle time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNShake = require('react-native-shake').default as {
      addListener: (cb: () => void) => { remove: () => void };
    };

    // In New Architecture (Bridgeless / TurboModule), the native module is
    // resolved lazily on the first method call, not during require().
    // Calling addListener() here (inside try) ensures any TurboModuleRegistry
    // error is caught and handled gracefully.
    const subscription = RNShake.addListener(onShake);
    return () => subscription.remove();
  } catch {
    console.warn(
      '[ReMarka] withShake is enabled but the native RNShake module could not be loaded.\n' +
      'Make sure react-native-shake is installed and linked: yarn add react-native-shake && npx pod-install',
    );
    return () => {};
  }
}
