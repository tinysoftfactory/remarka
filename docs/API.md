# ReMarka — Server API Documentation

## Overview

The ReMarka backend receives feedback submissions from mobile apps. All endpoints
are prefixed with `/v1`.

Authentication is performed via the `X-Api-Key` header.

---

## Base URL

```
https://your-remarka-server.example.com/v1
```

---

## Authentication

Every request must include the API key in the header:

```
X-Api-Key: <your-api-key>
```

If the key is missing or invalid, the server must respond with `401 Unauthorized`.

---

## Endpoints

### `POST /v1/feedback`

Receives a feedback submission from a client app.

#### Request

Content-Type: `multipart/form-data`

| Part         | Type             | Required | Description                                  |
|--------------|------------------|----------|----------------------------------------------|
| `data`       | JSON string      | Yes      | Structured feedback data (see schema below)  |
| `screenshot` | Binary (image)   | No       | JPEG screenshot taken just before the modal  |

##### `data` field JSON schema

```json
{
  "projectId": "string",
  "fields": [
    {
      "type": "email | email-required | text | text-required",
      "value": "string"
    }
  ],
  "logs": [
    {
      "message": "string",
      "params": ["any"],
      "timestamp": 1700000000000
    }
  ],
  "meta": {
    "timestamp": 1700000000000,
    "platform": "ios | android",
    "version": "0.1.0"
  }
}
```

##### `screenshot` part headers

```
Content-Disposition: form-data; name="screenshot"; filename="screenshot.jpg"
Content-Type: image/jpeg
```

#### Responses

| Status | Body                          | Meaning                       |
|--------|-------------------------------|-------------------------------|
| `200`  | `{}`                          | Feedback accepted             |
| `400`  | `{"error": "message"}`        | Malformed request             |
| `401`  | `{"error": "Unauthorized"}`   | Missing or invalid API key    |
| `404`  | `{"error": "Project not found"}` | Unknown `projectId`        |
| `413`  | `{"error": "Payload too large"}` | Screenshot or body too large |
| `500`  | `{"error": "message"}`        | Internal server error         |

---

## Data Constraints

| Field               | Constraint                                    |
|---------------------|-----------------------------------------------|
| `projectId`         | Non-empty string, max 128 chars               |
| `fields`            | Array, max 20 items                           |
| `fields[].value`    | String, max 10 000 chars                      |
| `logs`              | Array, max 500 items                          |
| `logs[].message`    | String, max 2 000 chars                       |
| `screenshot`        | JPEG/PNG, max 5 MB                            |
| `meta.platform`     | `"ios"` or `"android"`                        |

---

## Example cURL

```bash
curl -X POST https://your-remarka-server.example.com/v1/feedback \
  -H "X-Api-Key: sk_live_abc123" \
  -F 'data={"projectId":"proj_xyz","fields":[{"type":"email","value":"user@example.com"},{"type":"text","value":"App crashes on login"}],"logs":[{"message":"AuthService.login called","params":[],"timestamp":1700000001000}],"meta":{"timestamp":1700000002000,"platform":"ios","version":"0.1.0"}}' \
  -F 'screenshot=@/tmp/screen.jpg;type=image/jpeg'
```

---

## Suggested Data Model (Server Side)

```sql
-- Projects
CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Feedback submissions
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  TEXT NOT NULL REFERENCES projects(id),
  fields      JSONB NOT NULL,
  logs        JSONB NOT NULL DEFAULT '[]',
  screenshot  TEXT,              -- path or object-storage URL
  platform    TEXT,
  lib_version TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Recommended Stack

| Layer       | Suggestion                              |
|-------------|------------------------------------------|
| Runtime     | Node.js 20 / Bun / Python / Go          |
| Framework   | Fastify / Express / FastAPI / Gin        |
| Storage     | PostgreSQL + S3-compatible for images    |
| Auth        | Simple API-key lookup against DB         |
| Rate limit  | 60 requests / minute per API key         |

---

## Notes

- The client sends logs as JSON, not as a file, to keep parsing simple.
- The `screenshot` part is entirely optional; if the client is configured with
  `withScreenshot: false` it will not be included in the request.
- In stub/development mode the client prints the payload to console instead of
  making a network request (when `apiUrl` is not provided to `ReMarka.init`).
