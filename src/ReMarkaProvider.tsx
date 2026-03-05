import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FeedbackFieldValue, ShowOverrideConfig, ReMarkaStyles } from './types';
import { ReMarka } from './ReMarka';
import { subscribeToShake } from './services/ShakeDetector';
import { captureScreenshot } from './services/ScreenshotService';
import FeedbackModal, { FeedbackModalState } from './components/FeedbackModal';

// null means the modal is not mounted at all
type ProviderState = FeedbackModalState | null;

const SUCCESS_VISIBLE_MS = 2500;

interface ReMarkaProviderProps {
  styles?: ReMarkaStyles;
}

export const ReMarkaProvider: React.FC<ReMarkaProviderProps> = ({ styles }) => {
  const [modalState, setModalState] = useState<ProviderState>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback((message: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    setModalState({ phase: 'success', message });

    successTimerRef.current = setTimeout(() => {
      setModalState(null);
    }, SUCCESS_VISIBLE_MS);
  }, []);

  const openForm = useCallback(async (override?: ShowOverrideConfig) => {
    if (modalState !== null) return;

    const config = ReMarka.instance.getConfig();
    const withScreenshot = override?.withScreenshot ?? config.withScreenshot;
    let screenshot: string | null = null;

    if (withScreenshot) {
      screenshot = await captureScreenshot();
    }

    setModalState({ phase: 'form', screenshot });
    // Store override for use during submit — attached to state via closure
    overrideRef.current = override ?? {};
  }, [modalState]);

  const overrideRef = useRef<ShowOverrideConfig>({});

  const handleClose = useCallback(() => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setModalState(null);
  }, []);

  const handleSubmit = useCallback(
    async (fields: FeedbackFieldValue[]) => {
      const config = ReMarka.instance.getConfig();
      const effectiveConfig = { ...config, ...overrideRef.current };
      const api = ReMarka.instance.getApi();
      const logs = ReMarka.instance.getLogs();
      const meta = ReMarka.instance.getMeta();
      const screenshot = modalState?.phase === 'form' ? modalState.screenshot : null;

      try {
        await api.sendFeedback({
          projectId: config.projectId,
          tag: effectiveConfig.tag ?? 'feedback',
          fields,
          logs,
          screenshot,
          meta,
        });
      } catch (error) {
        console.warn('[ReMarka] Failed to send feedback:', error);
      }

      showSuccess(effectiveConfig.sentMessage ?? 'Thank you for your feedback!');
    },
    [modalState, showSuccess],
  );

  // Subscribe to programmatic show/hide events
  useEffect(() => {
    const unsubShow = ReMarka.instance.events.on('show', openForm);
    const unsubHide = ReMarka.instance.events.on('hide', handleClose);
    return () => {
      unsubShow();
      unsubHide();
    };
  }, [openForm, handleClose]);

  // Subscribe to shake if enabled
  useEffect(() => {
    let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
    try {
      config = ReMarka.instance.getConfig();
    } catch {
      return;
    }

    if (!config.withShake) return;

    const unsub = subscribeToShake(openForm);
    return unsub;
  }, [openForm]);

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Modal is not mounted when there's nothing to show
  if (modalState === null) return null;

  let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
  try {
    config = ReMarka.instance.getConfig();
  } catch {
    return null;
  }

  const effectiveConfig = { ...config, ...overrideRef.current };

  return (
    <FeedbackModal
      state={modalState}
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
      onSubmit={handleSubmit}
      onClose={handleClose}
    />
  );
};
