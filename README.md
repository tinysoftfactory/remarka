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
  apiUrl:    'https://your-remarka-server.example.com',
  logsThreshold: 100,
  withShake: true,
  withScreenshot: false,
  title: 'Please let us know your thoughts!',
  sentMessage: 'Thank you for your feedback!',
  fields: ['email', 'text-required'],
});

// 2. Add the provider near the root of your component tree
export default function App() {
  return (
    <>
      <ReMarkaProvider />
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

| Option           | Type        | Default                          | Description                                           |
|------------------|-------------|----------------------------------|-------------------------------------------------------|
| `projectId`      | `string`    | —                                | Your project identifier                               |
| `apiKey`         | `string`    | —                                | API key for server authentication                     |
| `apiUrl`         | `string`    | `undefined` (stub mode)          | Backend URL. If omitted, payload is logged to console |
| `logsThreshold`  | `number`    | `100`                            | How many recent logs to attach (max `500`)            |
| `withShake`      | `boolean`   | `false`                          | Show form on device shake                             |
| `withScreenshot` | `boolean`   | `false`                          | Capture a screenshot before opening the form          |
| `title`          | `string`    | —                                | Heading shown at the top of the modal                 |
| `sentMessage`    | `string`    | `'Thank you for your feedback!'` | Message shown after successful submission             |
| `fields`         | `FieldType[]` | `['email', 'text']`            | Fields to display in the form                         |

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

### `ReMarka.show()`

Programmatically opens the feedback modal (takes a screenshot first if enabled).

```ts
// e.g. in a "Report a bug" button handler
onPress={() => ReMarka.show()}
```

---

### `ReMarka.hide()`

Programmatically closes the modal.

---

### `<ReMarkaProvider />`

A renderless component that mounts the modal and wires up shake detection.
Place it once, near the root of your tree (outside `SafeAreaView` so it can
cover the full screen).

---

## Development / Stub Mode

If `apiUrl` is **not** provided, all feedback payloads are printed to the
console instead of being sent to a server. This lets you develop and test
without a running backend.

---

## Server API

See [API.md](docs/API.md) for the full server contract.
