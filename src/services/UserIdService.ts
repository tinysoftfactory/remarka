/**
 * UserIdService provides a stable, persisted per-device identifier used to
 * attach moderator responses to the right user.
 *
 * Persistence relies on @react-native-async-storage/async-storage, which is an
 * optional peer dependency loaded via dynamic require (like the other native
 * deps in this SDK). If it is not installed, a per-session in-memory id is used
 * instead and a one-time warning is printed — responses will then only work
 * within a single app session.
 *
 *   yarn add @react-native-async-storage/async-storage && npx pod-install
 */

const STORAGE_KEY = '@remarka:userId';

interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

let warned = false;

function getAsyncStorage(): AsyncStorageLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-async-storage/async-storage').default as AsyncStorageLike;
  } catch {
    if (!warned) {
      warned = true;
      console.warn(
        '[ReMarka] The moderator-response feature works best with persistent storage.\n' +
        'Install @react-native-async-storage/async-storage so the user id survives app restarts:\n' +
        'yarn add @react-native-async-storage/async-storage && npx pod-install',
      );
    }
    return null;
  }
}

/** RFC4122-ish v4 id. Not cryptographically strong — only needs to be unique per device. */
function generateUserId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedId: string | null = null;
let pending: Promise<string> | null = null;

/**
 * Returns the stable user id, generating and persisting one on first use.
 * The result is cached for the lifetime of the JS context.
 */
export function getUserId(): Promise<string> {
  if (cachedId) return Promise.resolve(cachedId);
  if (pending) return pending;

  pending = (async () => {
    const storage = getAsyncStorage();

    if (storage) {
      try {
        const existing = await storage.getItem(STORAGE_KEY);
        if (existing) {
          cachedId = existing;
          return existing;
        }
        const fresh = generateUserId();
        await storage.setItem(STORAGE_KEY, fresh);
        cachedId = fresh;
        return fresh;
      } catch {
        // Storage failed at runtime — fall through to an ephemeral id.
      }
    }

    cachedId = generateUserId();
    return cachedId;
  })();

  return pending;
}
