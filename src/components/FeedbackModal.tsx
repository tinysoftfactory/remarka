import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FieldType, FeedbackFieldValue } from '../types';
import FeedbackForm from './FeedbackForm';

type ModalState =
  | { phase: 'hidden' }
  | { phase: 'form'; screenshot: string | null }
  | { phase: 'success'; message: string };

interface FeedbackModalProps {
  state: ModalState;
  title?: string;
  fields: FieldType[];
  onSubmit: (fields: FeedbackFieldValue[]) => Promise<void>;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  state,
  title,
  fields,
  onSubmit,
  onClose,
}) => {
  const visible = state.phase !== 'hidden';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.safeArea}>
        {state.phase === 'form' && (
          <FeedbackForm
            title={title}
            fields={fields}
            screenshot={state.screenshot}
            onSubmit={onSubmit}
            onClose={onClose}
          />
        )}

        {state.phase === 'success' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{state.message}</Text>
          </View>
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
