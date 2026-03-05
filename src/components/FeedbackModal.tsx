import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { FieldType, FeedbackFieldValue, ShowAnimation, ReMarkaStyles } from '../types';
import FeedbackForm from './FeedbackForm';

type ModalState =
  | { phase: 'hidden' }
  | { phase: 'form'; screenshot: string | null; override: Record<string, unknown> }
  | { phase: 'success'; message: string };

interface FeedbackModalProps {
  state: ModalState;
  title?: string;
  fields: FieldType[];
  showAnimation: ShowAnimation;
  emailPlaceholderText?: string;
  messagePlaceholderText?: string;
  emailLabel?: string;
  messageLabel?: string;
  buttonLabel?: string;
  customStyles?: ReMarkaStyles;
  onSubmit: (fields: FeedbackFieldValue[]) => Promise<void>;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  state,
  title,
  fields,
  showAnimation,
  emailPlaceholderText,
  messagePlaceholderText,
  emailLabel,
  messageLabel,
  buttonLabel,
  customStyles,
  onSubmit,
  onClose,
}) => {
  const visible = state.phase !== 'hidden';

  return (
    <Modal
      visible={visible}
      animationType={showAnimation}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        {state.phase === 'form' && (
          <FeedbackForm
            title={title}
            fields={fields}
            screenshot={state.screenshot}
            emailPlaceholderText={emailPlaceholderText}
            messagePlaceholderText={messagePlaceholderText}
            emailLabel={emailLabel}
            messageLabel={messageLabel}
            buttonLabel={buttonLabel}
            customStyles={customStyles}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        )}

        {state.phase === 'success' && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{state.message}</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    fontSize: 56,
    color: '#16A34A',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
});

export default FeedbackModal;
