import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FeedbackFieldValue, ShowOverrideConfig, ReMarkaStyles } from './types';
import { ReMarka } from './ReMarka';
import { subscribeToShake } from './services/ShakeDetector';
import { captureScreenshot } from './services/ScreenshotService';
import FeedbackModal from './components/FeedbackModal';

type ModalState =
  | { phase: 'hidden' }
  | { phase: 'form'; screenshot: string | null; override: ShowOverrideConfig }
  | { phase: 'success'; message: string };

const SUCCESS_VISIBLE_MS = 2500;

interface ReMarkaProviderProps {
  styles?: ReMarkaStyles;
}

export const ReMarkaProvider: React.FC<ReMarkaProviderProps> = ({ styles }) => {
  const [modalState, setModalState] = useState<ModalState>({ phase: 'hidden' });
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback((message: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    setModalState({ phase: 'success', message });

    successTimerRef.current = setTimeout(() => {
      setModalState({ phase: 'hidden' });
    }, SUCCESS_VISIBLE_MS);
  }, []);

  const openForm = useCallback(async (override?: ShowOverrideConfig) => {
    if (modalState.phase !== 'hidden') return;

    const config = ReMarka.instance.getConfig();
    const withScreenshot = override?.withScreenshot ?? config.withScreenshot;
    let screenshot: string | null = null;

    if (withScreenshot) {
      screenshot = await captureScreenshot();
    }

    setModalState({ phase: 'form', screenshot, override: override ?? {} });
  }, [modalState.phase]);

  const handleClose = useCallback(() => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setModalState({ phase: 'hidden' });
  }, []);

  const handleSubmit = useCallback(
    async (fields: FeedbackFieldValue[]) => {
      const config = ReMarka.instance.getConfig();
      const override = modalState.phase === 'form' ? modalState.override : {};
      const effectiveConfig = { ...config, ...override };
      const api = ReMarka.instance.getApi();
      const logs = ReMarka.instance.getLogs();
      const meta = ReMarka.instance.getMeta();
      const screenshot = modalState.phase === 'form' ? modalState.screenshot : null;

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

      // Always show success, regardless of network errors
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

  let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
  try {
    config = ReMarka.instance.getConfig();
  } catch {
    return null;
  }

  const override = modalState.phase === 'form' ? modalState.override : {};
  const effectiveConfig = { ...config, ...override };

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
      customStyles={styles}
      onSubmit={handleSubmit}
      onClose={handleClose}
    />
  );
};
