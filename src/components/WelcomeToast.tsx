import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

const shakeIcon = require('../assets/shake.png');

// Shake animation: rapid left-right translation, repeated indefinitely
function useShakeAnimation() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(translateX, { toValue: -6,  duration: 60,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  6,  duration: 60,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -4,  duration: 50,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  4,  duration: 50,  useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  0,  duration: 40,  useNativeDriver: true }),
    ]);

    const loop = Animated.loop(
      Animated.sequence([
        sequence,
        Animated.delay(1200),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return translateX;
}

interface WelcomeToastProps {
  visible: boolean;
  message: string;
  icon?: React.ReactNode;
  popupStyle?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<TextStyle>;
  onDismiss: () => void;
}

const WelcomeToast: React.FC<WelcomeToastProps> = ({ visible, message, icon, popupStyle, messageStyle, onDismiss }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const shakeX = useShakeAnimation();

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 250 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, overlayOpacity]);

  const iconElement = icon !== undefined
    ? icon
    : (
      <Animated.Image
        source={shakeIcon}
        style={[styles.icon, { transform: [{ translateX: shakeX }] }]}
        resizeMode="contain"
      />
    );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.popup, popupStyle]}>
              {iconElement}
              <Text style={[styles.message, messageStyle]}>{message}</Text>
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
  icon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default WelcomeToast;
