export type FieldType =
  | 'email'
  | 'email-required'
  | 'text'
  | 'text-required';

export interface ReMarkaConfig {
  /** Unique project identifier */
  projectId: string;
  /** API key for authentication */
  apiKey: string;
  /** Number of recent logs to include in feedback (default: 100, max: 500) */
  logsThreshold?: number;
  /** Enable shake-to-show feedback form (default: false) */
  withShake?: boolean;
  /** Take a screenshot before showing the feedback form (default: false) */
  withScreenshot?: boolean;
  /** Title displayed at the top of the feedback modal */
  title?: string;
  /** Message shown after feedback is successfully sent */
  sentMessage?: string;
  /** Fields to display in the feedback form (default: ['email', 'text']) */
  fields?: FieldType[];
  /** Base URL of the ReMarka backend (default: stub mode) */
  apiUrl?: string;
}

export interface LogEntry {
  message: string;
  params: unknown[];
  timestamp: number;
}

export interface FeedbackFieldValue {
  type: FieldType;
  value: string;
}

export interface FeedbackPayload {
  projectId: string;
  fields: FeedbackFieldValue[];
  logs: LogEntry[];
  screenshot?: string | null;
  meta: {
    timestamp: number;
    platform: string;
    version: string;
  };
}

export type ReMarkaEvent = 'show' | 'hide';

export interface ReMarkaEventMap {
  show: undefined;
  hide: undefined;
}
