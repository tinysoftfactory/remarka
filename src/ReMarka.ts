import { Platform } from 'react-native';
import { ReMarkaConfig, LogEntry, FieldType, ShowOverrideConfig, WelcomeOverrideConfig, ResponseMessage, REMARKA_EVENTS } from './types';
import { SimpleEventEmitter } from './utils/EventEmitter';
import { ApiService } from './services/ApiService';
import { getUserId } from './services/UserIdService';

const MAX_LOGS_THRESHOLD = 500;
const DEFAULT_LOGS_THRESHOLD = 100;
const DEFAULT_FIELDS: FieldType[] = ['email', 'text'];
const DEFAULT_API_URL = 'https://remarka.tsoftfactory.com/api/v1';
const LIBRARY_VERSION = '0.2.0';

class ReMarkaController {
  private static _instance: ReMarkaController | null = null;

  readonly events = new SimpleEventEmitter();

  private _config: ReMarkaConfig | null = null;
  private _logs: LogEntry[] = [];
  private _api: ApiService | null = null;
  private _userMeta: Record<string, unknown> = {};
  private _enabled: boolean = true;
  // Runtime override set via setUserId() — takes precedence over config.userId.
  private _userIdOverride: string | null = null;
  // Ids of responses injected locally via showResponse() — their "mark read" is a no-op.
  private _localResponseIds = new Set<string>();

  private constructor() {}

  static get instance(): ReMarkaController {
    if (!ReMarkaController._instance) {
      ReMarkaController._instance = new ReMarkaController();
    }
    return ReMarkaController._instance;
  }

  // ─── Public static API ──────────────────────────────────────────────────────

  static init(config: ReMarkaConfig): void {
    const inst = ReMarkaController.instance;

    const threshold = Math.min(
      config.logsThreshold ?? DEFAULT_LOGS_THRESHOLD,
      MAX_LOGS_THRESHOLD,
    );

    inst._config = {
      fields: DEFAULT_FIELDS,
      withShake: false,
      withScreenshot: false,
      showAnimation: 'none',
      sentMessage: 'Thank you for your feedback!',
      emailPlaceholderText: 'your@email.com',
      messagePlaceholderText: 'Describe the issue or share your thoughts...',
      emailLabel: 'E-mail',
      messageLabel: 'Message',
      buttonLabel: 'Send',
      tag: 'feedback',
      showKeyboardImmediately: true,
      keyboardDelay: 1500,
      allowResponse: true,
      allowHandleResponse: true,
      allowHandleResponseTitle: 'Allow response',
      responseReadButtonLabel: 'Read',
      apiUrl: DEFAULT_API_URL,
      ...config,
      logsThreshold: threshold,
    };

    inst._api = new ApiService(inst._config.apiUrl!, config.apiKey);
    inst._userMeta = config.meta ?? {};

    if (__DEV__) {
      console.log('[ReMarka] Initialized', inst._config);
    }
  }

  static log(message: string, ...params: unknown[]): void {
    const inst = ReMarkaController.instance;
    const config = inst._config;
    const threshold = config?.logsThreshold ?? DEFAULT_LOGS_THRESHOLD;

    inst._logs.push({ message, params, timestamp: Date.now() });

    // Keep only the last `threshold` entries (rolling window)
    if (inst._logs.length > threshold) {
      inst._logs = inst._logs.slice(inst._logs.length - threshold);
    }
  }

  static show(override?: ShowOverrideConfig): void {
    if (!ReMarkaController.instance._enabled) return;
    ReMarkaController.instance.events.emit(REMARKA_EVENTS.SHOW, override);
  }

  /** Temporarily disable the feedback form (e.g. during gestures or animations). */
  static disable(): void {
    ReMarkaController.instance._enabled = false;
  }

  /** Re-enable the feedback form after it was disabled. */
  static enable(): void {
    ReMarkaController.instance._enabled = true;
  }

  /** Returns whether the feedback form is currently allowed to appear. */
  static get isEnabled(): boolean {
    return ReMarkaController.instance._enabled;
  }

  static setMeta(meta: Record<string, unknown>): void {
    ReMarkaController.instance._userMeta = meta;
  }

  /**
   * Sets the stable user id at runtime — e.g. after the user logs in. Takes
   * precedence over `config.userId` and the auto-generated/persisted id, and is
   * used for both feedback submissions and response checks from then on.
   * Pass `null` to clear the override and fall back to the configured/auto id.
   */
  static setUserId(userId: string | null): void {
    ReMarkaController.instance._userIdOverride = userId;
  }

  static hide(): void {
    ReMarkaController.instance.events.emit(REMARKA_EVENTS.HIDE);
  }

  static on<K extends keyof import('./types').ReMarkaEventMap>(
    event: K,
    handler: (payload: import('./types').ReMarkaEventMap[K]) => void,
  ): () => void {
    return ReMarkaController.instance.events.on(event, handler as (payload: unknown) => void);
  }

  static showWelcome(override?: WelcomeOverrideConfig): void {
    ReMarkaController.instance.events.emit(REMARKA_EVENTS.WELCOME, override);
  }

  static async send(data: { email?: string; message?: string; tag?: string } = {}): Promise<void> {
    const inst = ReMarkaController.instance;
    const config = inst.getConfig();
    const api = inst.getApi();

    const fields = [];
    if (data.email !== undefined) {
      fields.push({ type: 'email' as const, value: data.email });
    }
    if (data.message !== undefined) {
      fields.push({ type: 'text' as const, value: data.message });
    }

    await api.sendFeedback({
      projectId: config.projectId,
      tag: data.tag ?? config.tag ?? 'feedback',
      fields,
      logs: inst.getLogs(),
      userId: await inst.getUserId(),
      allowResponse: config.allowResponse !== false,
      allowHandleResponse: config.allowHandleResponse !== false,
      meta: inst.getMeta(),
    });
  }

  /**
   * Checks the backend for pending moderator responses for this user and, if any
   * are found, emits them so the ReMarkaProvider can display the response window.
   * Called automatically by ReMarkaProvider on mount and on app foreground;
   * can also be called manually (e.g. after login or a push notification).
   */
  static async checkResponses(): Promise<ResponseMessage[]> {
    const inst = ReMarkaController.instance;
    const config = inst._config;
    if (!config) {
      console.warn('[ReMarka:debug] checkResponses skipped — not initialized (config null).');
      return [];
    }
    if (config.allowResponse === false) {
      console.warn('[ReMarka:debug] checkResponses skipped — allowResponse is false.');
      return [];
    }

    try {
      const userId = await inst.getUserId();
      console.warn('[ReMarka:debug] checkResponses → userId =', userId, '| projectId =', config.projectId);
      const responses = await inst.getApi().getResponses(config.projectId, userId);
      console.warn('[ReMarka:debug] checkResponses ← server returned', responses.length, 'response(s):', JSON.stringify(responses));
      if (responses.length > 0) {
        inst.events.emit(REMARKA_EVENTS.RESPONSE, responses);
        console.warn('[ReMarka:debug] emitted RESPONSE event.');
      }
      return responses;
    } catch (error) {
      console.warn('[ReMarka:debug] checkResponses FAILED:', error);
      return [];
    }
  }

  /**
   * Testing/preview helper — displays the moderator-response window locally with
   * the given content, **without contacting the backend**. Use it to design and
   * verify the response UI before the server endpoints are ready.
   *
   * Pressing "Read" / dismissing the window will NOT make a network call for
   * responses shown this way. `id` is optional and auto-generated if omitted.
   *
   *   ReMarka.showResponse({ title: 'Re: your report', description: 'Fixed in 1.4.2 🎉' });
   */
  static showResponse(
    response:
      | { id?: string; title?: string; description: string; createdAt?: number }
      | { id?: string; title?: string; description: string; createdAt?: number }[],
  ): void {
    const inst = ReMarkaController.instance;
    const list = Array.isArray(response) ? response : [response];

    const normalized: ResponseMessage[] = list.map((r, i) => {
      const id = r.id ?? `local-${Date.now()}-${i}`;
      inst._localResponseIds.add(id);
      return { id, title: r.title, description: r.description, createdAt: r.createdAt };
    });

    inst.events.emit(REMARKA_EVENTS.RESPONSE, normalized);
  }

  /** Marks a moderator response as read so it is no longer shown to the user. */
  static async markResponseRead(responseId: string): Promise<void> {
    const inst = ReMarkaController.instance;
    const config = inst._config;
    if (!config) return;

    // Responses injected locally via showResponse() never hit the backend.
    if (inst._localResponseIds.has(responseId)) {
      inst._localResponseIds.delete(responseId);
      return;
    }

    try {
      const userId = await inst.getUserId();
      await inst.getApi().markResponseRead(config.projectId, userId, responseId);
    } catch (error) {
      if (__DEV__) {
        console.warn('[ReMarka] Failed to mark response as read:', error);
      }
    }
  }

  // ─── Internal helpers used by ReMarkaProvider ────────────────────────────────

  getConfig(): ReMarkaConfig {
    if (!this._config) {
      throw new Error('[ReMarka] Not initialized. Call ReMarka.init() before using ReMarkaProvider.');
    }
    return this._config;
  }

  getLogs(): LogEntry[] {
    const threshold = this._config?.logsThreshold ?? DEFAULT_LOGS_THRESHOLD;
    return this._logs.slice(-threshold);
  }

  clearLogs(): void {
    this._logs = [];
  }

  getApi(): ApiService {
    if (!this._api) {
      throw new Error('[ReMarka] Not initialized. Call ReMarka.init() before using ReMarkaProvider.');
    }
    return this._api;
  }

  getMeta() {
    return {
      ...this._userMeta,
      timestamp: Date.now(),
      platform: Platform.OS,
      version: LIBRARY_VERSION,
    };
  }

  /**
   * Resolves the stable user id used to route moderator responses.
   * Priority: runtime setUserId() → config.userId → persisted AsyncStorage id → ephemeral.
   */
  getUserId(): Promise<string> {
    if (this._userIdOverride) return Promise.resolve(this._userIdOverride);
    const custom = this._config?.userId;
    if (custom) return Promise.resolve(custom);
    return getUserId();
  }
}

export const ReMarka = ReMarkaController;
export default ReMarka;
