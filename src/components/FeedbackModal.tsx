import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FieldType, FeedbackFieldValue, ShowAnimation, ReMarkaStyles } from '../types';
import FeedbackForm from './FeedbackForm';

export type FeedbackModalState =
  | { phase: 'form'; screenshot: string | null }
  | { phase: 'success'; message: string; icon?: ReactNode };

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
  isOffline?: boolean;
  onSubmit: (fields: FeedbackFieldValue[]) => Promise<void>;
  onClose: () => void;
}

// Inner component that can safely call useSafeAreaInsets()
// because it is always rendered inside SafeAreaProvider below.
const FormContent: React.FC<Omit<FeedbackModalProps, 'visible' | 'showAnimation' | 'state'> & { screenshot: string | null }> = ({
  screenshot,
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
  isOffline,
  onSubmit,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.formContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <FeedbackForm
        title={title}
        fields={fields}
        screenshot={screenshot}
        emailPlaceholderText={emailPlaceholderText}
        messagePlaceholderText={messagePlaceholderText}
        emailLabel={emailLabel}
        messageLabel={messageLabel}
        buttonLabel={buttonLabel}
        showKeyboardImmediately={showKeyboardImmediately}
        keyboardDelay={keyboardDelay}
        customStyles={customStyles}
        isOffline={isOffline}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </View>
  );
};

interface SuccessOverlayProps {
  visible: boolean;
  message: string;
  icon?: ReactNode;
  customStyles?: ReMarkaStyles;
  onClose: () => void;
}

const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ visible, message, icon, customStyles, onClose }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 250 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.popup, customStyles?.sentMessageContainerStyle]}>
              {icon !== undefined
                ? icon
                : <Text style={styles.successIcon}>✓</Text>
              }
              <Text style={[styles.successText, customStyles?.sentMessageTextStyle]}>
                {message}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  showAnimation,
  state,
  customStyles,
  onClose,
  ...rest
}) => {
  const isForm    = state.phase === 'form';
  const isSuccess = state.phase === 'success';

  return (
    <>
      <Modal
        visible={visible && isForm}
        animationType={showAnimation}
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <SafeAreaProvider>
          <FormContent
            screenshot={isForm ? state.screenshot : null}
            customStyles={customStyles}
            onClose={onClose}
            {...rest}
          />
        </SafeAreaProvider>
      </Modal>

      <SuccessOverlay
        visible={visible && isSuccess}
        message={isSuccess ? state.message : ''}
        icon={isSuccess ? state.icon : undefined}
        customStyles={customStyles}
        onClose={onClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 28,
    maxWidth: 320,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  successIcon: {
    fontSize: 48,
    color: '#16A34A',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FeedbackModal;
