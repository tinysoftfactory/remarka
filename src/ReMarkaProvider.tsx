import React, { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { FeedbackFieldValue, ShowOverrideConfig, WelcomeOverrideConfig, ReMarkaStyles, ShowAnimation, REMARKA_EVENTS } from './types';
import { ReMarka } from './ReMarka';
import { subscribeToShake } from './services/ShakeDetector';
import { isConnected, subscribeToNetInfo } from './services/NetInfoService';
import { captureScreenshot } from './services/ScreenshotService';
import FeedbackModal, { FeedbackModalState } from './components/FeedbackModal';
import WelcomeToast from './components/WelcomeToast';

// Duration to wait for the Modal close animation before unmounting (ms).
// Must be >= the native Modal animation duration (~300ms).
const CLOSE_ANIMATION_DURATION: Record<ShowAnimation, number> = {
  none:  0,
  slide: 350,
  fade:  350,
};

const SUCCESS_VISIBLE_MS = 2500;
const DEFAULT_WELCOME_MESSAGE = "Shake your device if you'd like to send feedback.";
const DEFAULT_WELCOME_DURATION = 3000;

interface ReMarkaProviderProps {
  styles?: ReMarkaStyles;
}

export const ReMarkaProvider: React.FC<ReMarkaProviderProps> = ({ styles }) => {
  // contentState drives what is rendered inside the Modal.
  // null means the Modal is not in the tree at all.
  const [contentState, setContentState] = useState<FeedbackModalState | null>(null);
  // modalVisible drives the Modal's `visible` prop.
  // Separated from contentState so we can animate in/out before mounting/unmounting.
  const [modalVisible, setModalVisible] = useState(false);

  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(DEFAULT_WELCOME_MESSAGE);
  const [welcomeIcon, setWelcomeIcon] = useState<React.ReactNode>(undefined);
  const [welcomePopupStyle, setWelcomePopupStyle] = useState<StyleProp<ViewStyle>>(undefined);
  const [welcomeMessageStyle, setWelcomeMessageStyle] = useState<StyleProp<TextStyle>>(undefined);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOffline, setIsOffline] = useState(false);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overrideRef     = useRef<ShowOverrideConfig>({});
  // Stored so we know how long to wait on close
  const animationRef    = useRef<ShowAnimation>('none');

  const clearTimers = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (closeTimerRef.current)   clearTimeout(closeTimerRef.current);
    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
  };

  const openWelcome = useCallback((override?: WelcomeOverrideConfig) => {
    let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
    try { config = ReMarka.instance.getConfig(); } catch { return; }

    const message  = override?.welcomeMessage ?? config.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE;
    const duration = override?.welcomeDuration ?? config.welcomeDuration ?? DEFAULT_WELCOME_DURATION;
    const icon        = override?.welcomeIcon !== undefined ? override.welcomeIcon : config.welcomeIcon;
    const popupStyle  = override?.welcomePopupStyle ?? config.welcomePopupStyle;
    const messageStyle = override?.welcomeMessageStyle ?? config.welcomeMessageStyle;

    setWelcomeMessage(message);
    setWelcomeIcon(icon as ReactNode);
    setWelcomePopupStyle(popupStyle);
    setWelcomeMessageStyle(messageStyle);
    setWelcomeVisible(true);

    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    welcomeTimerRef.current = setTimeout(() => setWelcomeVisible(false), duration);
  }, []);

  // Phase 1: mount Modal (visible=false)
  // Phase 2: next tick → set visible=true (triggers open animation)
  const openForm = useCallback(async (override?: ShowOverrideConfig) => {
    if (contentState !== null) return;

    const config = ReMarka.instance.getConfig();
    const withScreenshot = override?.withScreenshot ?? config.withScreenshot;
    let screenshot: string | null = null;

    if (withScreenshot) {
      screenshot = await captureScreenshot(
        undefined,
        override?.screenshotQuality ?? config.screenshotQuality,
        override?.screenshotMaxWidth ?? config.screenshotMaxWidth,
      );
    }

    overrideRef.current  = override ?? {};
    animationRef.current = (override?.showAnimation ?? config.showAnimation ?? 'none') as ShowAnimation;

    // Check connectivity before mounting
    const connected = await isConnected();
    setIsOffline(!connected);

    // Mount first
    setContentState({ phase: 'form', screenshot });
    // Then animate in (deferred to ensure the Modal node exists before visible flips)
    setTimeout(() => {
      setModalVisible(true);
      ReMarka.instance.events.emit(REMARKA_EVENTS.OPEN);
    }, 0);
  }, [contentState]);

  // Phase 1: set visible=false (triggers close animation)
  // Phase 2: after animation → unmount (contentState = null)
  const handleClose = useCallback(() => {
    clearTimers();
    setModalVisible(false);
    ReMarka.instance.events.emit(REMARKA_EVENTS.CLOSE);

    const delay = CLOSE_ANIMATION_DURATION[animationRef.current];
    closeTimerRef.current = setTimeout(() => {
      setContentState(null);
    }, delay);
  }, []);

  const showSuccess = useCallback((message: string, icon?: ReactNode) => {
    clearTimers();
    setContentState({ phase: 'success', message, icon });

    successTimerRef.current = setTimeout(handleClose, SUCCESS_VISIBLE_MS);
  }, [handleClose]);

  const handleSubmit = useCallback(
    async (fields: FeedbackFieldValue[]) => {
      const config = ReMarka.instance.getConfig();
      const effectiveConfig = { ...config, ...overrideRef.current };
      const api = ReMarka.instance.getApi();
      const screenshot = contentState?.phase === 'form' ? contentState.screenshot : null;

      try {
        await api.sendFeedback({
          projectId: config.projectId,
          tag: effectiveConfig.tag ?? 'feedback',
          fields,
          logs: ReMarka.instance.getLogs(),
          screenshot,
          meta: ReMarka.instance.getMeta(),
        });
      } catch (error) {
        console.warn('[ReMarka] Failed to send feedback:', error);
      }

      ReMarka.instance.events.emit(REMARKA_EVENTS.SENT, fields);
      ReMarka.instance.clearLogs();
      showSuccess(
        effectiveConfig.sentMessage ?? 'Thank you for your feedback!',
        effectiveConfig.sentMessageIcon as ReactNode,
      );
    },
    [contentState, showSuccess],
  );

  useEffect(() => {
    const unsubShow    = ReMarka.instance.events.on(REMARKA_EVENTS.SHOW, openForm);
    const unsubHide    = ReMarka.instance.events.on(REMARKA_EVENTS.HIDE, handleClose);
    const unsubWelcome = ReMarka.instance.events.on(REMARKA_EVENTS.WELCOME, openWelcome);
    return () => {
      unsubShow();
      unsubHide();
      unsubWelcome();
    };
  }, [openForm, handleClose, openWelcome]);

  // Auto-show welcome hint once on mount when withShake is enabled
  useEffect(() => {
    let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
    try { config = ReMarka.instance.getConfig(); } catch { return; }

    if (config.withShake && config.withWelcome !== false) {
      openWelcome();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
    try {
      config = ReMarka.instance.getConfig();
    } catch {
      return;
    }
    if (!config.withShake) return;
    return subscribeToShake(() => {
      if (!ReMarka.isEnabled) return;
      openForm();
    }, config.shakeThreshold);
  }, [openForm]);

  // Subscribe to network changes while the form is open
  useEffect(() => {
    if (contentState === null) {
      setIsOffline(false);
      return;
    }
    return subscribeToNetInfo((connected) => setIsOffline(!connected));
  }, [contentState]);

  useEffect(() => {
    return clearTimers;
  }, []);

  if (contentState === null) {
    return (
      <WelcomeToast
        visible={welcomeVisible}
        message={welcomeMessage}
        icon={welcomeIcon}
        popupStyle={welcomePopupStyle}
        messageStyle={welcomeMessageStyle}
        onDismiss={() => setWelcomeVisible(false)}
      />
    );
  }

  let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
  try {
    config = ReMarka.instance.getConfig();
  } catch {
    return null;
  }

  const effectiveConfig = { ...config, ...overrideRef.current };

  return (
    <FeedbackModal
      visible={modalVisible}
      state={contentState}
      title={effectiveConfig.title}
      fields={effectiveConfig.fields ?? ['email', 'text']}
      showAnimation={effectiveConfig.showAnimation ?? 'none'}
      emailPlaceholderText={effectiveConfig.emailPlaceholderText}
      messagePlaceholderText={effectiveConfig.messagePlaceholderText}
      emailLabel={effectiveConfig.emailLabel}
      messageLabel={effectiveConfig.messageLabel}
      buttonLabel={effectiveConfig.buttonLabel}
      showKeyboardImmediately={effectiveConfig.showKeyboardImmediately}
      keyboardDelay={effectiveConfig.keyboardDelay}
      customStyles={styles}
      isOffline={isOffline}
      onSubmit={handleSubmit}
      onClose={handleClose}
    />
  );
};
