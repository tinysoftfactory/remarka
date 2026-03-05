import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldType, FeedbackFieldValue, ShowAnimation, ReMarkaStyles } from '../types';
import FeedbackForm from './FeedbackForm';

export type FeedbackModalState =
  | { phase: 'form'; screenshot: string | null }
  | { phase: 'success'; message: string };

interface FeedbackModalProps {
  state: FeedbackModalState;
  title?: string;
  fields: FieldType[];
  showAnimation: ShowAnimation;
  emailPlaceholderText?: string;
  messagePlaceholderText?: string;
  emailLabel?: string;
  messageLabel?: string;
  buttonLabel?: string;
  showKeyboardImmediately?: boolean;
  keyboardDelay?: number;
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
  showKeyboardImmediately,
  keyboardDelay,
  customStyles,
  onSubmit,
  onClose,
}) => {
  return (
    <Modal
      visible
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
            showKeyboardImmediately={showKeyboardImmediately}
            keyboardDelay={keyboardDelay}
            customStyles={customStyles}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        )}

        {state.phase === 'success' && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={[styles.successContainer, customStyles?.sentMessageContainerStyle]}>
              <TouchableOpacity
                style={styles.successCloseButton}
                onPress={onClose}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Text style={styles.successCloseButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={[styles.successText, customStyles?.sentMessageTextStyle]}>
                {state.message}
              </Text>
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
  successCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  successCloseButtonText: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 24,
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
