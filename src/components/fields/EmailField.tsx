import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hasError?: boolean;
  placeholder?: string;
  label?: string;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const EmailField = forwardRef<TextInput, EmailFieldProps>(({
  value,
  onChange,
  required,
  hasError,
  placeholder = 'your@email.com',
  label = 'E-mail',
  inputStyle,
  labelStyle,
}, ref) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, labelStyle]}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        ref={ref}
        style={[styles.input, hasError && styles.inputError, inputStyle]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      {hasError && (
        <Text style={styles.errorText}>Please enter a valid email address</Text>
      )}
    </View>
  );
});

EmailField.displayName = 'EmailField';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: '#EF4444',
  },
});

export default EmailField;
