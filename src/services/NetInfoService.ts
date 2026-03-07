/**
 * NetInfoService uses @react-native-community/netinfo for connectivity checks.
 * The package is optional — install it only if you want offline detection:
 *
 *   yarn add @react-native-community/netinfo && npx pod-install
 */

type UnsubscribeFn = () => void;

function getNetInfo(): { fetch: () => Promise<{ isConnected: boolean | null }>; addEventListener: (cb: (state: { isConnected: boolean | null }) => void) => UnsubscribeFn } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-community/netinfo').default;
  } catch {
    return null;
  }
}

/** Returns current connectivity status. Resolves to `true` when netinfo is not installed (optimistic). */
export async function isConnected(): Promise<boolean> {
  const NetInfo = getNetInfo();
  if (!NetInfo) return true;

  const state = await NetInfo.fetch();
  return state.isConnected ?? true;
}

/**
 * Subscribes to connectivity changes.
 * Returns an unsubscribe function.
 * No-ops (returns empty unsubscribe) when netinfo is not installed.
 */
export function subscribeToNetInfo(onChange: (connected: boolean) => void): UnsubscribeFn {
  const NetInfo = getNetInfo();
  if (!NetInfo) return () => {};

  return NetInfo.addEventListener((state) => {
    onChange(state.isConnected ?? true);
  });
}
