import React from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface ReMarkaStyles {
  /** Style for the main scrollable container of the form */
  containerStyle?: StyleProp<ViewStyle>;
  /** Style for the modal title text */
  titleStyle?: StyleProp<TextStyle>;
  /** Style for all text inputs (email and message) */
  inputStyle?: StyleProp<TextStyle>;
  /** Style for all field label texts */
  labelStyle?: StyleProp<TextStyle>;
  /** Style for the submit button container */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Style for the submit button label text */
  buttonTitleStyle?: StyleProp<TextStyle>;
  /** Style for the success screen container */
  sentMessageContainerStyle?: StyleProp<ViewStyle>;
  /** Style for the success message text */
  sentMessageTextStyle?: StyleProp<TextStyle>;
}

export type FieldType =
  | 'email'
  | 'email-required'
  | 'text'
  | 'text-required';

export type ShowAnimation = 'none' | 'slide' | 'fade';

export interface ReMarkaConfig {
  /** Unique project identifier */
  projectId: string;
  /** API key for authentication */
  apiKey: string;
  /** Number of recent logs to include in feedback (default: 100, max: 500) */
  logsThreshold?: number;
  /** Enable shake-to-show feedback form (default: false) */
  withShake?: boolean;
  /** Shake sensitivity threshold in G-force units (default: 1.8). Lower = more sensitive. */
  shakeThreshold?: number;
  /** Take a screenshot before showing the feedback form (default: false) */
  withScreenshot?: boolean;
  /** Title displayed at the top of the feedback modal */
  title?: string;
  /** Message shown after feedback is successfully sent */
  sentMessage?: string;
  /** Custom React element rendered above the sent message (replaces the default ✓ icon) */
  sentMessageIcon?: React.ReactNode;
  /** Fields to display in the feedback form (default: ['email', 'text']) */
  fields?: FieldType[];
  /** Base URL of the ReMarka backend (default: 'https://remarka.tsoftfactory.com/api/v1') */
  apiUrl?: string;
  /** Modal open animation (default: 'none') */
  showAnimation?: ShowAnimation;
  /** Placeholder text for email inputs (default: 'your@email.com') */
  emailPlaceholderText?: string;
  /** Placeholder text for message inputs (default: 'Describe the issue or share your thoughts...') */
  messagePlaceholderText?: string;
  /** Label text for email fields (default: 'E-mail') */
  emailLabel?: string;
  /** Label text for message fields (default: 'Message') */
  messageLabel?: string;
  /** Label text for the submit button (default: 'Send') */
  buttonLabel?: string;
  /** Tag sent along with feedback for categorisation (default: 'feedback') */
  tag?: string;
  /** Custom metadata merged into every feedback submission (e.g. app version, user id) */
  meta?: Record<string, unknown>;
  /** Automatically focus the first relevant input after the form opens (default: true) */
  showKeyboardImmediately?: boolean;
  /** Delay in ms before the keyboard is shown after the form opens (default: 1500) */
  keyboardDelay?: number;
  /** JPEG quality for screenshot compression, 0–1 (default: 0.5) */
  screenshotQuality?: number;
  /** Max width in pixels for screenshot downscaling (default: 800) */
  screenshotMaxWidth?: number;
  /** Show a welcome hint after init when withShake is true (default: true) */
  withWelcome?: boolean;
  /** Text shown in the welcome hint (default: "Shake your device if you'd like to send feedback.") */
  welcomeMessage?: string;
  /** How long the welcome hint is visible in ms (default: 3000) */
  welcomeDuration?: number;
  /** Custom React element rendered above the welcome message (replaces the default shake icon) */
  welcomeIcon?: React.ReactNode;
  /** Style for the welcome popup container */
  welcomePopupStyle?: StyleProp<ViewStyle>;
  /** Style for the welcome message text */
  welcomeMessageStyle?: StyleProp<TextStyle>;
}

export interface WelcomeOverrideConfig {
  welcomeMessage?: string;
  welcomeDuration?: number;
  /** Custom React element rendered above the welcome message (replaces the default shake icon) */
  welcomeIcon?: React.ReactNode;
  /** Style for the welcome popup container */
  welcomePopupStyle?: StyleProp<ViewStyle>;
  /** Style for the welcome message text */
  welcomeMessageStyle?: StyleProp<TextStyle>;
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
  tag: string;
  fields: FeedbackFieldValue[];
  logs: LogEntry[];
  screenshot?: string | null;
  meta: {
    timestamp: number;
    platform: string;
    version: string;
    [key: string]: unknown;
  };
}

/** Subset of ReMarkaConfig that can be passed to ReMarka.show() to override the base config for a single call. */
export type ShowOverrideConfig = Partial<
  Omit<ReMarkaConfig, 'projectId' | 'apiKey' | 'apiUrl'>
>;

export const REMARKA_EVENTS = {
  SHOW: 'show',
  HIDE: 'hide',
  WELCOME: 'welcome',
  OPEN: 'open',
  SENT: 'sent',
  CLOSE: 'close',
} as const;

export type ReMarkaEvent = typeof REMARKA_EVENTS[keyof typeof REMARKA_EVENTS];

export interface ReMarkaEventMap {
  show: ShowOverrideConfig | undefined;
  hide: undefined;
  welcome: WelcomeOverrideConfig | undefined;
  /** Emitted when the feedback form becomes visible */
  open: undefined;
  /** Emitted after feedback is successfully submitted. Payload contains the submitted fields. */
  sent: FeedbackFieldValue[];
  /** Emitted when the feedback form closes (both after success and manual close) */
  close: undefined;
}
