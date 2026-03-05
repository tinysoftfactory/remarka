import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FieldType, FeedbackFieldValue, ShowAnimation, ReMarkaStyles } from '../types';
import FeedbackForm from './FeedbackForm';

export type FeedbackModalState =
  | { phase: 'form'; screenshot: string | null }
  | { phase: 'success'; message: string };

interface FeedbackModalProps {
  visible: boolean;
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

// Inner component that can safely call useSafeAreaInsets()
// because it is always rendered inside SafeAreaProvider below.
const ModalContent: React.FC<Omit<FeedbackModalProps, 'visible' | 'showAnimation'>> = ({
  state,
  title,
  fields,
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
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
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
    </View>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  showAnimation,
  ...rest
}) => {
  return (
    <Modal
      visible={visible}
      animationType={showAnimation}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaProvider>
        <ModalContent {...rest} />
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
