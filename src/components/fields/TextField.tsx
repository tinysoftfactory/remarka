import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hasError?: boolean;
  placeholder?: string;
  label?: string;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const TextField = forwardRef<TextInput, TextFieldProps>(({
  value,
  onChange,
  required,
  hasError,
  placeholder = 'Describe the issue or share your thoughts...',
  label = 'Message',
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
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      {hasError && (
        <Text style={styles.errorText}>This field is required</Text>
      )}
    </View>
  );
});

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 110,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
});

export default TextField;
