# ReMarka — Moderator Response Feature (Server Implementation Guide)

This document describes the backend changes required to support the **moderator
response** feature added to the ReMarka React Native SDK. It is written for the
agent/developer implementing the server side. The SDK side is already done — this
spec defines the contract the SDK now expects.

## Overview

1. When a user submits feedback, the SDK now also sends a stable **`userId`**
   plus two consent flags: **`allowResponse`** and **`allowHandleResponse`**.
2. If `allowResponse` is `true`, a moderator is permitted to write a **response**
   to that feedback. The backend stores responses linked to the user.
3. On every app launch / foreground, the SDK calls **`GET /responses`** to ask
   "are there any unread responses for this user?". If there are, it shows them.
4. When the user reads/dismisses a response, the SDK calls
   **`POST /responses/:id/read`** to mark it read so it is never shown again.

All endpoints are under the same base URL and auth as the existing feedback API
(`X-Api-Key` header). Base URL example: `https://remarka.tsoftfactory.com/api/v1`.

---

## 1. Database changes

### 1.1 `feedback` table — new columns

| Column                  | Type         | Notes                                                                 |
|-------------------------|--------------|-----------------------------------------------------------------------|
| `user_id`               | string/uuid  | Stable per-device id sent by the SDK. **Index this.** Nullable for old rows. |
| `allow_response`        | boolean      | Whether the user permits a moderator reply to this feedback. Default `true`. |
| `allow_handle_response` | boolean      | Whether the user was shown the consent toggle (audit/analytics). Default `true`. |

`user_id` is **not** an authenticated account id — it is a random UUID the SDK
generates once per device and persists locally. Treat it as an opaque key for
grouping feedback and routing responses. Do not assume uniqueness across devices
or that it maps to a real person.

### 1.2 New `responses` table

| Column        | Type           | Notes                                                        |
|---------------|----------------|-------------------------------------------------------------|
| `id`          | pk             | Returned to the SDK; used to mark read.                     |
| `project_id`  | string         | Scope responses per project.                                |
| `feedback_id` | fk → feedback  | The feedback this response replies to (optional but recommended). |
| `user_id`     | string/uuid    | Copy of the feedback's `user_id`. **Index `(project_id, user_id, read_at)`.** |
| `title`       | string, null   | Optional window title.                                      |
| `description` | text, not null | Required response body shown to the user.                   |
| `read_at`     | timestamp, null| `null` = unread. Set when the SDK reports it read.          |
| `created_at`  | timestamp      | Used for ordering / `createdAt` field.                      |

A response is "pending" when `read_at IS NULL`.

### 1.3 Moderator workflow (out of SDK scope, but required)

Moderators need UI/admin to create a `responses` row for a given feedback. Only
allow creating a response when the target feedback has `allow_response = true`.

---

## 2. API changes

### 2.1 `POST /feedback` — accept new fields

The SDK sends `multipart/form-data` with a `data` JSON part (unchanged shape,
new fields added) and an optional `screenshot` file part.

The `data` JSON now includes:

```jsonc
{
  "projectId": "proj_123",
  "tag": "feedback",
  "fields": [ { "type": "email", "value": "a@b.com" }, { "type": "text", "value": "..." } ],
  "logs": [ /* ... */ ],

  // NEW:
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "allowResponse": true,
  "allowHandleResponse": true,

  "meta": { "timestamp": 1718183762000, "platform": "ios", "version": "0.1.0" }
}
```

Backend must:
- Persist `userId` → `feedback.user_id`.
- Persist `allowResponse` → `feedback.allow_response`.
- Persist `allowHandleResponse` → `feedback.allow_handle_response`.
- Be tolerant: these fields may be **absent** on requests from older SDK
  versions. Default `allowResponse`/`allowHandleResponse` to `true` and
  `userId` to `null` when missing.

Response: unchanged (`2xx` on success).

### 2.2 `GET /responses` — fetch pending responses

Called by the SDK on launch and on every app foreground.

**Request**
```
GET /responses?projectId={projectId}&userId={userId}
Headers: X-Api-Key: <key>, Accept: application/json
```

**Behaviour**
- Return all responses for `(project_id, user_id)` where `read_at IS NULL`.
- Order by `created_at ASC` (oldest first — the SDK shows them one at a time).
- Return an empty list when there are none.

**Response (200)** — either a bare array or `{ "responses": [...] }` is accepted
by the SDK; prefer the wrapped form:

```json
{
  "responses": [
    {
      "id": "resp_987",
      "title": "Re: your report",
      "description": "Thanks for the details — we shipped a fix in 1.4.2.",
      "createdAt": 1718200000000
    }
  ]
}
```

Field contract expected by the SDK:
- `id` — **required**, string or number (SDK stringifies it).
- `description` — **required**, string. Items missing this are ignored by the SDK.
- `title` — optional string.
- `createdAt` — optional number (epoch ms).

### 2.3 `POST /responses/:id/read` — mark a response read

Called when the user presses "Read" or dismisses the response window.

**Request**
```
POST /responses/{id}/read
Headers: X-Api-Key: <key>, Accept: application/json, Content-Type: application/json
Body: { "projectId": "proj_123", "userId": "f47ac10b-..." }
```

**Behaviour**
- Set `read_at = now()` for the matching response.
- Verify the response belongs to the given `project_id` + `user_id` before
  updating (prevents one device marking another's responses read).
- Idempotent: marking an already-read response read again is a no-op `2xx`.
- Return `2xx` on success; the SDK ignores the body.

---

## 3. Edge cases & notes

- **Empty/optional `userId`:** if a request arrives without `userId`, store the
  feedback but it cannot receive responses (no key to route on). This is expected
  for very old clients or if local storage was unavailable on the device.
- **Consent off:** if `allowResponse` is `false`, moderators must not be able to
  respond; the SDK will also stop calling `GET /responses` for such installs only
  if the whole feature is disabled in app config — so still enforce server-side.
- **Polling frequency:** `GET /responses` is called on cold start and on each
  foreground transition. Keep it cheap (indexed lookup). No pagination needed for
  v1; the SDK queues and shows whatever is returned.
- **Auth:** all three endpoints use the existing `X-Api-Key` mechanism. There is
  no per-user auth token — `userId` is the only user identifier.

---

## 4. Implementation checklist

- [ ] Add `user_id`, `allow_response`, `allow_handle_response` columns to `feedback`.
- [ ] Create `responses` table with index on `(project_id, user_id, read_at)`.
- [ ] Update `POST /feedback` to read & store the 3 new fields (tolerant of absence).
- [ ] Implement `GET /responses?projectId=&userId=` returning unread responses.
- [ ] Implement `POST /responses/:id/read` (scoped to project + user, idempotent).
- [ ] Moderator admin: create response (only when feedback `allow_response = true`).
