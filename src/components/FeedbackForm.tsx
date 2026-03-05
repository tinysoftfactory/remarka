import React, { useState, useRef, useEffect, createRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { FieldType, FeedbackFieldValue, ReMarkaStyles } from '../types';
import EmailField from './fields/EmailField';
import TextField from './fields/TextField';

interface FeedbackFormProps {
  title?: string;
  fields: FieldType[];
  screenshot: string | null;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Returns the field that should receive focus on open:
 * 1. First required field (email-required or text-required)
 * 2. First message field (text or text-required)
 * 3. First field of any type
 * 4. null if no fields
 */
function resolveAutoFocusField(fields: FieldType[]): FieldType | null {
  if (fields.length === 0) return null;
  return (
    fields.find((f) => f === 'email-required' || f === 'text-required') ??
    fields.find((f) => f === 'text' || f === 'text-required') ??
    fields[0]
  );
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  title,
  fields,
  screenshot,
  emailPlaceholderText,
  messagePlaceholderText,
  emailLabel,
  messageLabel,
  buttonLabel = 'Send',
  showKeyboardImmediately = true,
  keyboardDelay = 1500,
  customStyles,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f, ''])),
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // One ref per field type
  const inputRefs = useRef<Partial<Record<FieldType, React.RefObject<TextInput>>>>(
    Object.fromEntries(fields.map((f) => [f, createRef<TextInput>()])),
  );

  // Auto-focus logic
  useEffect(() => {
    if (!showKeyboardImmediately) return;

    const targetField = resolveAutoFocusField(fields);
    if (!targetField) return;

    const timer = setTimeout(() => {
      inputRefs.current[targetField]?.current?.focus();
    }, keyboardDelay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = (field: FieldType, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, boolean> = {};
    let valid = true;

    for (const field of fields) {
      const value = values[field]?.trim() ?? '';

      if (field === 'email-required') {
        if (!value || !isValidEmail(value)) {
          nextErrors[field] = true;
          valid = false;
        }
      } else if (field === 'email') {
        if (value && !isValidEmail(value)) {
          nextErrors[field] = true;
          valid = false;
        }
      } else if (field === 'text-required') {
        if (!value) {
          nextErrors[field] = true;
          valid = false;
        }
      }
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload: FeedbackFieldValue[] = fields.map((type) => ({
      type,
      value: values[type]?.trim() ?? '',
    }));

    try {
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, customStyles?.containerStyle]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        {title ? <Text style={[styles.title, customStyles?.titleStyle]}>{title}</Text> : null}
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {screenshot ? (
        <View style={styles.screenshotContainer}>
          <Text style={styles.screenshotLabel}>Screenshot</Text>
          <Image
            source={{ uri: screenshot }}
            style={styles.screenshot}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {fields.map((field) => {
        if (field === 'email' || field === 'email-required') {
          return (
            <EmailField
              key={field}
              ref={inputRefs.current[field]}
              value={values[field] ?? ''}
              onChange={(v) => setValue(field, v)}
              required={field === 'email-required'}
              hasError={errors[field]}
              placeholder={emailPlaceholderText}
              label={emailLabel}
              inputStyle={customStyles?.inputStyle}
              labelStyle={customStyles?.labelStyle}
            />
          );
        }
        return (
          <TextField
            key={field}
            ref={inputRefs.current[field]}
            value={values[field] ?? ''}
            onChange={(v) => setValue(field, v)}
            required={field === 'text-required'}
            hasError={errors[field]}
            placeholder={messagePlaceholderText}
            label={messageLabel}
            inputStyle={customStyles?.inputStyle}
            labelStyle={customStyles?.labelStyle}
          />
        );
      })}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled, customStyles?.buttonStyle]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.submitButtonText, customStyles?.buttonTitleStyle]}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
  },
  closeButton: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 24,
  },
  screenshotContainer: {
    marginBottom: 20,
  },
  screenshotLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  screenshot: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackForm;
