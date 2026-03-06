# ReMarka

A plug-and-play React Native feedback service. Drop it into any app and let
users submit feedback (with optional screenshot and logs) via a shake gesture
or a programmatic call.

---

## Installation

```bash
yarn add remarka react-native-safe-area-context

# Optional — required only if the features are enabled:
yarn add react-native-shake       # withShake: true
yarn add react-native-view-shot   # withScreenshot: true

npx pod-install   # iOS
```

> **Note:** `react-native-safe-area-context` is a required dependency.
> ReMarka bundles its own `SafeAreaProvider` inside the modal, so you do **not**
> need to add one to your app — but if your app already uses it, both will
> coexist without conflict.

---

## Quick Start

```tsx
import { ReMarka, ReMarkaProvider } from 'remarka';

// 1. Initialize once (e.g. in App.tsx, before rendering)
ReMarka.init({
  projectId: 'your-project-id',
  apiKey:    'your-api-key',
  logsThreshold: 100,
  withShake: true,
  withScreenshot: false,
  showAnimation: 'slide',
  title: 'Please let us know your thoughts!',
  sentMessage: 'Thank you for your feedback!',
  fields: ['email', 'text-required'],
  tag: 'feedback',
  meta: {
    appVersion: '1.0.0',
    environment: 'production',
  },
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

| Option                   | Type                  | Default                                          | Description                                                          |
|--------------------------|-----------------------|--------------------------------------------------|----------------------------------------------------------------------|
| `projectId`              | `string`              | —                                                | Your project identifier (required)                                   |
| `apiKey`                 | `string`              | —                                                | API key for server authentication (required)                         |
| `apiUrl`                 | `string`              | `'https://remarka.tsoftfactory.com/api/v1'`      | Backend URL override                                                 |
| `logsThreshold`          | `number`              | `100`                                            | How many recent logs to attach (max `500`)                           |
| `withShake`              | `boolean`             | `false`                                          | Show form on device shake                                            |
| `withScreenshot`         | `boolean`             | `false`                                          | Capture a screenshot before opening the form                         |
| `screenshotQuality`      | `number`              | `0.5`                                            | JPEG compression quality, 0–1                                        |
| `screenshotMaxWidth`     | `number`              | `800`                                            | Max screenshot width in pixels (scaled proportionally)               |
| `showAnimation`          | `ShowAnimation`       | `'none'`                                         | Modal open animation: `'none'`, `'slide'`, `'fade'`                  |
| `title`                  | `string`              | —                                                | Heading shown at the top of the modal                                |
| `sentMessage`            | `string`              | `'Thank you for your feedback!'`                 | Message shown after successful submission                            |
| `sentMessageIcon`        | `React.ReactNode`     | `✓` (default checkmark)                          | Custom element rendered above the sent message (replaces `✓`)        |
| `fields`                 | `FieldType[]`         | `['email', 'text']`                              | Fields to display in the form                                        |
| `tag`                    | `string`              | `'feedback'`                                     | Tag sent with every submission for categorisation                    |
| `emailLabel`             | `string`              | `'E-mail'`                                       | Label for email input fields                                         |
| `messageLabel`           | `string`              | `'Message'`                                      | Label for text input fields                                          |
| `buttonLabel`            | `string`              | `'Send'`                                         | Submit button label                                                  |
| `emailPlaceholderText`   | `string`              | `'your@email.com'`                               | Placeholder for email inputs                                         |
| `messagePlaceholderText` | `string`              | `'Describe the issue or share your thoughts...'` | Placeholder for text inputs                                          |
| `showKeyboardImmediately`| `boolean`             | `true`                                           | Auto-focus the first relevant input on open                          |
| `keyboardDelay`          | `number`              | `1500`                                           | Delay in ms before the keyboard appears                              |
| `meta`                   | `Record<string, unknown>` | `{}`                                         | Custom metadata attached to every submission (e.g. app version, user id) |
| `withWelcome`            | `boolean`             | `true`                                           | Show the welcome hint on mount when `withShake` is `true`            |
| `welcomeMessage`         | `string`              | `"Shake your device if you'd like to send feedback."` | Text shown in the welcome hint                                  |
| `welcomeDuration`        | `number`              | `3000`                                           | How long the welcome hint stays visible (ms)                         |
| `welcomeIcon`            | `React.ReactNode`     | Animated shake icon                              | Custom element rendered above the welcome message (replaces default icon) |
| `welcomePopupStyle`      | `StyleProp<ViewStyle>`| —                                                | Style for the welcome popup container                                |
| `welcomeMessageStyle`    | `StyleProp<TextStyle>`| —                                                | Style for the welcome message text                                   |

#### Field types

| Value              | Description                               |
|--------------------|-------------------------------------------|
| `'email'`          | Optional email address field              |
| `'email-required'` | Required email address field (validated)  |
| `'text'`           | Optional free-text area                   |
| `'text-required'`  | Required free-text area                   |

---

### `ReMarka.log(message, ...params)`

Stores a log entry in an in-memory rolling buffer. The buffer is capped at
`logsThreshold` (max `500`). Logs are attached to every feedback submission and
are cleared automatically after each successful send.

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
  sentMessageIcon: <MyCheckIcon />,
  withScreenshot: true,
  showKeyboardImmediately: false,
});
```

---

### `ReMarka.hide()`

Programmatically closes the feedback modal.

---

### `ReMarka.send(data?)`

Sends feedback directly via the API, bypassing the form UI entirely. Useful for
programmatic submissions — e.g. from your own custom form, on a caught error, or
from an automated flow.

| Field     | Type     | Description                                                |
|-----------|----------|------------------------------------------------------------|
| `email`   | `string` | User email (optional)                                      |
| `message` | `string` | Feedback text (optional)                                   |
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

### `ReMarka.setMeta(meta)`

Replaces the custom metadata that is merged into every feedback submission.
Call this any time — e.g. after login when the user id becomes available.

```ts
ReMarka.setMeta({
  appVersion: '2.1.0',
  userId: 'user-456',
  plan: 'pro',
});
```

The following keys are **reserved** and always set by the SDK regardless of what
you pass: `timestamp`, `platform`, `version`.

---

### `ReMarka.showWelcome(override?)`

Programmatically shows the welcome hint. Works regardless of the `withWelcome`
config value — `withWelcome: false` only disables the automatic show on mount,
not manual calls.

```ts
ReMarka.showWelcome();

ReMarka.showWelcome({
  welcomeMessage: 'Shake to report a bug!',
  welcomeDuration: 4000,
  welcomeIcon: <Text style={{ fontSize: 48 }}>📳</Text>,
  welcomePopupStyle: { backgroundColor: '#1F2937' },
  welcomeMessageStyle: { color: '#F9FAFB' },
});
```

Tapping anywhere on the overlay or the popup dismisses it early.

---

### `<ReMarkaProvider styles? />`

Mounts the feedback modal and wires up shake detection. Place it once near the
root of your tree, outside any `SafeAreaView`. No `SafeAreaProvider` setup is
required — ReMarka manages safe area insets internally.

#### `styles` prop — `ReMarkaStyles`

All style props are optional and are merged on top of the default styles.

| Prop                        | Type                   | Applies to                              |
|-----------------------------|------------------------|-----------------------------------------|
| `containerStyle`            | `StyleProp<ViewStyle>` | Scrollable form container               |
| `titleStyle`                | `StyleProp<TextStyle>` | Modal title text                        |
| `labelStyle`                | `StyleProp<TextStyle>` | All field label texts                   |
| `inputStyle`                | `StyleProp<TextStyle>` | All text inputs (email and message)     |
| `buttonStyle`               | `StyleProp<ViewStyle>` | Submit button container                 |
| `buttonTitleStyle`          | `StyleProp<TextStyle>` | Submit button label text                |
| `sentMessageContainerStyle` | `StyleProp<ViewStyle>` | Success screen container                |
| `sentMessageTextStyle`      | `StyleProp<TextStyle>` | Success message text                    |

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

### Success screen

After the user taps **Send**, the success screen is always shown — even if the
network request failed (the error is logged to the device console but does not
block the UI). The log buffer is cleared after each submission.

The screen can be dismissed in three ways:
- Tap the **✕ button** in the top-right corner
- Tap **anywhere** on the screen
- Wait **2.5 s** — it closes automatically

Customisation options:

| Config / style              | Where                  | Description                                  |
|-----------------------------|------------------------|----------------------------------------------|
| `sentMessage`               | `ReMarka.init()`       | Success text                                 |
| `sentMessageIcon`           | `ReMarka.init()` / `ReMarka.show()` | React element above the text (replaces `✓`) |
| `sentMessageContainerStyle` | `<ReMarkaProvider styles />` | Container style                        |
| `sentMessageTextStyle`      | `<ReMarkaProvider styles />` | Text style                             |

---

### Welcome hint

When `withShake: true`, a welcome hint is shown once on mount to let users know
they can shake the device. It auto-dismisses after `welcomeDuration` ms and can
be tapped to dismiss early.

```ts
ReMarka.init({
  withShake: true,
  withWelcome: true,           // default, can be set to false to disable auto-show
  welcomeMessage: "Shake your device if you'd like to send feedback.",
  welcomeDuration: 3000,
  welcomeIcon: <MyShakeIcon />, // replaces the default animated shake icon
  welcomePopupStyle: { backgroundColor: '#1F2937', borderRadius: 24 },
  welcomeMessageStyle: { color: '#F9FAFB' },
});
```

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
To test locally, pass a custom `apiUrl` pointing to your local backend.
If `apiUrl` is set to an empty string, the SDK prints the full payload to the
console with an 800 ms simulated delay instead of making a network request.

---

## Server API

See [API.md](docs/API.md) for the full server contract.
