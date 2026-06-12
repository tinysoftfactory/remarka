import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import { ReMarkaStyles, ResponseMessage } from '../types';

interface ResponseModalProps {
  visible: boolean;
  response: ResponseMessage | null;
  readButtonLabel?: string;
  customStyles?: ReMarkaStyles;
  /** Called when the user dismisses the window (button, backdrop, or back press). */
  onRead: () => void;
}

/**
 * Centered popup that shows a moderator's reply to the user's feedback.
 * Dismissing it (button, backdrop tap, or hardware back) marks it as read.
 */
const ResponseModal: React.FC<ResponseModalProps> = ({
  visible,
  response,
  readButtonLabel = 'Read',
  customStyles,
  onRead,
}) => {
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
      visible={visible && response !== null}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRead}
    >
      <TouchableWithoutFeedback onPress={onRead}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.popup, customStyles?.responseContainerStyle]}>
              {response?.title ? (
                <Text style={[styles.title, customStyles?.responseTitleStyle]}>
                  {response.title}
                </Text>
              ) : null}

              <ScrollView
                style={styles.descriptionScroll}
                contentContainerStyle={styles.descriptionContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.description, customStyles?.responseDescriptionStyle]}>
                  {response?.description ?? ''}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={[styles.button, customStyles?.responseButtonStyle]}
                onPress={onRead}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, customStyles?.responseButtonTitleStyle]}>
                  {readButtonLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 24,
    maxWidth: 360,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionScroll: {
    flexGrow: 0,
  },
  descriptionContent: {
    paddingBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ResponseModal;
