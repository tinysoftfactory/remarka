import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FeedbackFieldValue } from './types';
import { ReMarka } from './ReMarka';
import { subscribeToShake } from './services/ShakeDetector';
import { captureScreenshot } from './services/ScreenshotService';
import FeedbackModal from './components/FeedbackModal';

type ModalState =
  | { phase: 'hidden' }
  | { phase: 'form'; screenshot: string | null }
  | { phase: 'success'; message: string };

const SUCCESS_VISIBLE_MS = 2500;

export const ReMarkaProvider: React.FC = () => {
  const [modalState, setModalState] = useState<ModalState>({ phase: 'hidden' });
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openForm = useCallback(async () => {
    // Ignore if already open
    if (modalState.phase !== 'hidden') return;

    const config = ReMarka.instance.getConfig();
    let screenshot: string | null = null;

    if (config.withScreenshot) {
      screenshot = await captureScreenshot();
    }

    setModalState({ phase: 'form', screenshot });
  }, [modalState.phase]);

  const handleClose = useCallback(() => {
    setModalState({ phase: 'hidden' });
  }, []);

  const handleSubmit = useCallback(
    async (fields: FeedbackFieldValue[]) => {
      const config = ReMarka.instance.getConfig();
      const api = ReMarka.instance.getApi();
      const logs = ReMarka.instance.getLogs();
      const meta = ReMarka.instance.getMeta();
      const screenshot = modalState.phase === 'form' ? modalState.screenshot : null;

      await api.sendFeedback({
        projectId: config.projectId,
        fields,
        logs,
        screenshot,
        meta,
      });

      setModalState({
        phase: 'success',
        message: config.sentMessage ?? 'Thank you for your feedback!',
      });

      successTimerRef.current = setTimeout(() => {
        setModalState({ phase: 'hidden' });
      }, SUCCESS_VISIBLE_MS);
    },
    [modalState],
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
      // Not initialized yet — shake will not be set up
      return;
    }

    if (!config.withShake) return;

    const unsub = subscribeToShake(openForm);
    return unsub;
  }, [openForm]);

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  let config: ReturnType<typeof ReMarka.instance.getConfig> | null = null;
  try {
    config = ReMarka.instance.getConfig();
  } catch {
    return null;
  }

  return (
    <FeedbackModal
      state={modalState}
      title={config.title}
      fields={config.fields ?? ['email', 'text']}
      onSubmit={handleSubmit}
      onClose={handleClose}
    />
  );
};
