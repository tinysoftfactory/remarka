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
  Keyboard,
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
  isOffline?: boolean;
  /** Whether to show the response-consent checkbox (allowResponse && allowHandleResponse). */
  showResponseConsent?: boolean;
  /** Title of the response-consent checkbox. */
  responseConsentTitle?: string;
  /** Effective allowResponse value used when the consent checkbox is not shown. */
  allowResponseDefault?: boolean;
  /** Whether the user was offered a choice about receiving a response. */
  allowHandleResponse?: boolean;
  onSubmit: (
    fields: FeedbackFieldValue[],
    consent: { allowResponse: boolean; allowHandleResponse: boolean },
  ) => Promise<void>;
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
  isOffline = false,
  showResponseConsent = false,
  responseConsentTitle = 'Allow response',
  allowResponseDefault = true,
  allowHandleResponse = true,
  onSubmit,
  onClose,
}) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f, ''])),
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [textFieldFocused, setTextFieldFocused] = useState(false);
  // Consent checkbox defaults to checked when shown.
  const [responseAllowed, setResponseAllowed] = useState(true);

  // One ref per field type
  const inputRefs = useRef<Partial<Record<FieldType, React.RefObject<TextInput>>>>(
    Object.fromEntries(fields.map((f) => [f, createRef<TextInput>()])),
  );

  // Auto-focus logic
  useEffect(() => {
    if (!showKeyboardImmediately || isOffline) return;

    const targetField = resolveAutoFocusField(fields);
    if (!targetField) return;

    const timer = setTimeout(() => {
      inputRefs.current[targetField]?.current?.focus();
    }, keyboardDelay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On Android, dismissing the keyboard via the hardware back button does not
  // fire the TextInput's onBlur, leaving the UI in its "focused" state. Listen
  // to the global keyboard-hide event so the button layout is restored.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      setTextFieldFocused(false);
    });
    return () => sub.remove();
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

    const allowResponse = showResponseConsent ? responseAllowed : allowResponseDefault;

    try {
      await onSubmit(payload, { allowResponse, allowHandleResponse });
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
            onFocus={() => setTextFieldFocused(true)}
            onBlur={() => setTextFieldFocused(false)}
            showInlineSubmit={textFieldFocused}
            inlineSubmitLoading={loading}
            onInlineSubmit={handleSubmit}
          />
        );
      })}

      {!textFieldFocused && (
        <>
          {showResponseConsent && (
            <TouchableOpacity
              style={[styles.consentRow, customStyles?.responseConsentRowStyle]}
              onPress={() => setResponseAllowed((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, responseAllowed && styles.checkboxChecked]}>
                {responseAllowed ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={[styles.consentLabel, customStyles?.responseConsentLabelStyle]}>
                {responseConsentTitle}
              </Text>
            </TouchableOpacity>
          )}
          {isOffline && (
            <Text style={styles.offlineWarning}>Check your Internet connection</Text>
          )}
          <TouchableOpacity
            style={[styles.submitButton, (loading || isOffline) && styles.submitButtonDisabled, customStyles?.buttonStyle]}
            onPress={handleSubmit}
            disabled={loading || isOffline}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.submitButtonText, customStyles?.buttonTitleStyle]}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </>
      )}
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
    fontSize: 24,
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  consentLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  offlineWarning: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FeedbackForm;
