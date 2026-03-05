# ReMarka

A plug-and-play React Native feedback service. Drop it into any app and let
users submit feedback (with optional screenshot and logs) via a shake gesture
or a programmatic call.

---

## Installation

```bash
yarn add remarka

# Optional — required only if the features are enabled:
yarn add react-native-shake       # withShake: true
yarn add react-native-view-shot   # withScreenshot: true

npx pod-install   # iOS
```

---

## Quick Start

```tsx
import { ReMarka, ReMarkaProvider } from 'remarka';

// 1. Initialize once (e.g. in App.tsx, before rendering)
ReMarka.init({
  projectId: 'your-project-id',
  apiKey:    'your-api-key',
  // apiUrl defaults to 'https://remarka.tsoftfactory.com/api/v1'
  logsThreshold: 100,
  withShake: true,
  withScreenshot: false,
  showAnimation: 'slide',
  title: 'Please let us know your thoughts!',
  sentMessage: 'Thank you for your feedback!',
  fields: ['email', 'text-required'],
  tag: 'feedback',
  showKeyboardImmediately: true,
  keyboardDelay: 1500,
});

// 2. Add the provider near the root of your component tree
export default function App() {
  return (
    <>
      <ReMarkaProvider
        styles={{
          buttonStyle: { backgroundColor: '#2563EB' },
          buttonTitleStyle: { fontWeight: '700' },
        }}
      />
      <SafeAreaView>
        {/* your app */}
      </SafeAreaView>
    </>
  );
}
```

---

## API

### `ReMarka.init(config)`

| Option                   | Type            | Default                                          | Description                                      |
|--------------------------|-----------------|--------------------------------------------------|--------------------------------------------------|
| `projectId`              | `string`        | —                                                | Your project identifier (required)               |
| `apiKey`                 | `string`        | —                                                | API key for server authentication (required)     |
| `apiUrl`                 | `string`        | `'https://remarka.tsoftfactory.com/api/v1'`      | Backend URL override                             |
| `logsThreshold`          | `number`        | `100`                                            | How many recent logs to attach (max `500`)       |
| `withShake`              | `boolean`       | `false`                                          | Show form on device shake                        |
| `withScreenshot`         | `boolean`       | `false`                                          | Capture a screenshot before opening the form     |
| `showAnimation`          | `ShowAnimation` | `'none'`                                         | Modal open animation: `'none'`, `'slide'`, `'fade'` |
| `title`                  | `string`        | —                                                | Heading shown at the top of the modal            |
| `sentMessage`            | `string`        | `'Thank you for your feedback!'`                 | Message shown after successful submission        |
| `fields`                 | `FieldType[]`   | `['email', 'text']`                              | Fields to display in the form                    |
| `tag`                    | `string`        | `'feedback'`                                     | Tag sent with every submission for categorisation|
| `emailLabel`             | `string`        | `'E-mail'`                                       | Label for email input fields                     |
| `messageLabel`           | `string`        | `'Message'`                                      | Label for text input fields                      |
| `buttonLabel`            | `string`        | `'Send'`                                         | Submit button label                              |
| `emailPlaceholderText`   | `string`        | `'your@email.com'`                               | Placeholder for email inputs                     |
| `messagePlaceholderText` | `string`        | `'Describe the issue or share your thoughts...'` | Placeholder for text inputs                      |
| `showKeyboardImmediately`| `boolean`       | `true`                                           | Auto-focus the first relevant input on open      |
| `keyboardDelay`          | `number`        | `1500`                                           | Delay in ms before the keyboard appears          |

#### Field types

| Value             | Description                               |
|-------------------|-------------------------------------------|
| `'email'`         | Optional email address field              |
| `'email-required'`| Required email address field (validated)  |
| `'text'`          | Optional free-text area                   |
| `'text-required'` | Required free-text area                   |

---

### `ReMarka.log(message, ...params)`

Stores a log entry in an in-memory rolling buffer. The buffer size is capped at
`logsThreshold` (max `500`). Logs are attached to every feedback submission.

```ts
ReMarka.log('User tapped checkout button', { cartSize: 3 });
```

---

### `ReMarka.show(override?)`

Programmatically opens the feedback modal (takes a screenshot first if enabled).
Accepts an optional `ShowOverrideConfig` that overrides the base config for this
single call only. Any field except `projectId`, `apiKey`, and `apiUrl` can be overridden.

```ts
// Basic call — uses config from init()
ReMarka.show();

// Override for a specific call
ReMarka.show({
  title: 'Found a bug?',
  fields: ['email-required', 'text-required'],
  tag: 'bug-report',
  showAnimation: 'fade',
  buttonLabel: 'Report',
  sentMessage: 'Bug reported! We will fix it soon.',
  withScreenshot: true,
  showKeyboardImmediately: false,
});
```

---

### `ReMarka.hide()`

Programmatically closes the modal.

---

### `ReMarka.send(data?)`

Sends feedback directly via the API, bypassing the form UI entirely. Useful for
programmatic submissions — e.g. from your own custom form, on a caught error, or
from an automated flow.

| Field     | Type     | Description                                              |
|-----------|----------|----------------------------------------------------------|
| `email`   | `string` | User email (optional)                                    |
| `message` | `string` | Feedback text (optional)                                 |
| `tag`     | `string` | Overrides the `tag` from `init()` for this call (optional) |

Logs collected via `ReMarka.log()` are always included. Returns a `Promise` that
resolves when the request completes and rejects on network error.

```ts
// Simple message
await ReMarka.send({ message: 'App crashed on the checkout screen' });

// With email and custom tag
await ReMarka.send({
  email: 'user@example.com',
  message: 'Payment button does not respond',
  tag: 'bug-report',
});

// In a catch block
try {
  await processPayment();
} catch (error) {
  ReMarka.log('processPayment failed', error);
  await ReMarka.send({ message: String(error), tag: 'crash' });
}
```

---

### `<ReMarkaProvider styles? />`

Mounts the feedback modal and wires up shake detection. Place it once near the
root of your tree, outside `SafeAreaView` so it can cover the full screen.

#### `styles` prop — `ReMarkaStyles`

All style props are optional and are merged on top of the default styles, so
you only need to specify the properties you want to change.

| Prop                       | Type                      | Applies to                                        |
|----------------------------|---------------------------|---------------------------------------------------|
| `containerStyle`           | `StyleProp<ViewStyle>`    | Scrollable form container (padding etc)           |
| `titleStyle`               | `StyleProp<TextStyle>`    | Modal title text                                  |
| `labelStyle`               | `StyleProp<TextStyle>`    | All field label texts                             |
| `inputStyle`               | `StyleProp<TextStyle>`    | All text inputs (email and message)               |
| `buttonStyle`              | `StyleProp<ViewStyle>`    | Submit button container                           |
| `buttonTitleStyle`         | `StyleProp<TextStyle>`    | Submit button label text                          |
| `sentMessageContainerStyle`| `StyleProp<ViewStyle>`    | Success screen container                          |
| `sentMessageTextStyle`     | `StyleProp<TextStyle>`    | Success message text                              |

```tsx
<ReMarkaProvider
  styles={{
    containerStyle:            { backgroundColor: '#FFFFFF', paddingHorizontal: 24 },
    titleStyle:                { fontSize: 22, color: '#111827' },
    labelStyle:                { color: '#6B7280', fontSize: 13 },
    inputStyle:                { borderColor: '#6366F1', borderRadius: 4 },
    buttonStyle:               { backgroundColor: '#6366F1', borderRadius: 6 },
    buttonTitleStyle:          { fontSize: 15, letterSpacing: 0.5 },
    sentMessageContainerStyle: { backgroundColor: '#F0FDF4' },
    sentMessageTextStyle:      { color: '#15803D', fontSize: 20 },
  }}
/>
```

---

### Success screen behaviour

After the user taps **Send**, the success message (`sentMessage`) is always
shown — even if the network request failed (the error is logged to console but
does not block the UI).

The success screen can be dismissed in three ways:
- Tap the **✕ button** in the top-right corner
- Tap **anywhere** on the screen
- Wait **2.5 s** — it closes automatically

The screen appearance is customisable via `sentMessageContainerStyle` and
`sentMessageTextStyle` in the `styles` prop of `<ReMarkaProvider />`.

---

### Auto-focus behaviour

When `showKeyboardImmediately` is `true` (default), the SDK automatically
focuses the most relevant input after `keyboardDelay` ms. Focus priority:

1. First **required** field (`email-required` or `text-required`)
2. First **message** field (`text` or `text-required`)
3. First field of any type
4. No focus if the `fields` array is empty

Set `showKeyboardImmediately: false` to disable this behaviour entirely.

---

## Development / Stub Mode

The default `apiUrl` points to `https://remarka.tsoftfactory.com/api/v1`.
To test locally without a real server, pass a custom `apiUrl` pointing to your
local backend, or remove it and set `apiUrl: ''` — in that case the SDK will
print the full payload to the console with an 800 ms simulated delay.

---

## Server API

See [API.md](docs/API.md) for the full server contract.
