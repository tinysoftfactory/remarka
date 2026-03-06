/**
 * ShakeDetector uses expo-sensors Accelerometer for shake detection.
 * This allows configuring the shake threshold in JS without native changes.
 *
 * Install: npx expo install expo-sensors
 * or:      yarn add expo-sensors && npx pod-install
 */

type UnsubscribeFn = () => void;

// Default threshold in G-force units (1 G = 9.81 m/s²).
// expo-sensors Accelerometer reports values in Gs on iOS and m/s² on Android —
// we normalise to Gs by dividing Android values by 9.81 inside the listener.
// Lower value → more sensitive. Typical range: 1.5 – 3.0.
const DEFAULT_SHAKE_THRESHOLD = 1.8;

// Minimum ms between two consecutive shake triggers (debounce).
const SHAKE_DEBOUNCE_MS = 1000;

// How often the accelerometer reports data (ms).
const UPDATE_INTERVAL_MS = 100;

export function subscribeToShake(
  onShake: () => void,
  threshold: number = DEFAULT_SHAKE_THRESHOLD,
): UnsubscribeFn {
  let Accelerometer: {
    addListener: (cb: (data: { x: number; y: number; z: number }) => void) => { remove: () => void };
    setUpdateInterval: (ms: number) => void;
  } | null = null;

  try {
    // Dynamic require keeps expo-sensors optional at bundle time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Accelerometer = require('expo-sensors').Accelerometer;
  } catch {
    console.warn(
      '[ReMarka] withShake is enabled but expo-sensors is not installed.\n' +
      'Run: yarn add expo-sensors && npx pod-install',
    );
    return () => {};
  }

  Accelerometer!.setUpdateInterval(UPDATE_INTERVAL_MS);

  let lastShakeAt = 0;

  const subscription = Accelerometer!.addListener(({ x, y, z }) => {
    // expo-sensors reports in Gs on iOS and m/s² on Android.
    // Normalise to Gs so the threshold is platform-agnostic.
    const { Platform } = require('react-native');
    const factor = Platform.OS === 'android' ? 1 / 9.81 : 1;
    const gX = x * factor;
    const gY = y * factor;
    const gZ = z * factor;

    // Magnitude of the acceleration vector minus gravity (≈ 1 G at rest).
    const totalG = Math.sqrt(gX * gX + gY * gY + gZ * gZ);
    const delta = Math.abs(totalG - 1);

    if (delta > threshold) {
      const now = Date.now();
      if (now - lastShakeAt > SHAKE_DEBOUNCE_MS) {
        lastShakeAt = now;
        onShake();
      }
    }
  });

  return () => subscription.remove();
}
