import { Platform } from 'react-native';
import { ReMarkaConfig, LogEntry, FieldType, ShowOverrideConfig } from './types';
import { SimpleEventEmitter } from './utils/EventEmitter';
import { ApiService } from './services/ApiService';

const MAX_LOGS_THRESHOLD = 500;
const DEFAULT_LOGS_THRESHOLD = 100;
const DEFAULT_FIELDS: FieldType[] = ['email', 'text'];
const DEFAULT_API_URL = 'https://remarka.tsoftfactory.com/api/v1';
const LIBRARY_VERSION = '0.1.0';

class ReMarkaController {
  private static _instance: ReMarkaController | null = null;

  readonly events = new SimpleEventEmitter();

  private _config: ReMarkaConfig | null = null;
  private _logs: LogEntry[] = [];
  private _api: ApiService | null = null;

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
      apiUrl: DEFAULT_API_URL,
      ...config,
      logsThreshold: threshold,
    };

    inst._api = new ApiService(inst._config.apiUrl!, config.apiKey);

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
    ReMarkaController.instance.events.emit('show', override);
  }

  static hide(): void {
    ReMarkaController.instance.events.emit('hide');
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
      meta: inst.getMeta(),
    });
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
      timestamp: Date.now(),
      platform: Platform.OS,
      version: LIBRARY_VERSION,
    };
  }
}

export const ReMarka = ReMarkaController;
export default ReMarka;
