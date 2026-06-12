import { FeedbackPayload, ResponseMessage } from '../types';

const STUB_DELAY_MS = 800;

export class ApiService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendFeedback(payload: FeedbackPayload): Promise<void> {
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      projectId: payload.projectId,
      tag: payload.tag,
      fields: payload.fields,
      logs: payload.logs,
      userId: payload.userId,
      allowResponse: payload.allowResponse,
      allowHandleResponse: payload.allowHandleResponse,
      meta: payload.meta,
    }));

    if (payload.screenshot) {
      formData.append('screenshot', {
        uri: payload.screenshot,
        type: 'image/jpeg',
        name: 'screenshot.jpg',
      } as unknown as Blob);
    }

    const response = await fetch(`${this.apiUrl}/feedback`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`ReMarka API error ${response.status}: ${errorText}`);
    }
  }

  /**
   * Fetches pending (unread) moderator responses for this user.
   * Returns an empty array when there are none.
   */
  async getResponses(projectId: string, userId: string): Promise<ResponseMessage[]> {
    const url = `${this.apiUrl}/responses?projectId=${encodeURIComponent(projectId)}&userId=${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`ReMarka API error ${response.status}: ${errorText}`);
    }

    const body = await response.json().catch(() => null);
    // Accept a bare array, or a wrapper under common keys.
    const list = Array.isArray(body)
      ? body
      : body?.responses ?? body?.data ?? body?.items ?? body?.result;
    if (!Array.isArray(list)) return [];

    const pickString = (item: Record<string, unknown>, keys: string[]): string | undefined => {
      for (const key of keys) {
        const v = item[key];
        if (typeof v === 'string' && v.length > 0) return v;
      }
      return undefined;
    };

    return list
      .map((raw): ResponseMessage | null => {
        if (!raw || typeof raw !== 'object') return null;
        const item = raw as Record<string, unknown>;

        const idRaw = item.id ?? item._id ?? item.uuid ?? item.responseId;
        // Tolerate different field names the backend might use for the body text.
        const description = pickString(item, ['description', 'text', 'message', 'body', 'answer', 'response']);
        if (typeof idRaw === 'undefined' || !description) return null;

        const createdRaw = item.createdAt ?? item.created_at ?? item.created;
        const createdAt =
          typeof createdRaw === 'number'
            ? createdRaw
            : typeof createdRaw === 'string' && !Number.isNaN(Date.parse(createdRaw))
            ? Date.parse(createdRaw)
            : undefined;

        return {
          id: String(idRaw),
          title: pickString(item, ['title', 'subject', 'header']),
          description,
          createdAt,
        };
      })
      .filter((r): r is ResponseMessage => r !== null);
  }

  /** Marks a moderator response as read so it is no longer returned by getResponses. */
  async markResponseRead(projectId: string, userId: string, responseId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/responses/${encodeURIComponent(responseId)}/read`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, userId }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`ReMarka API error ${response.status}: ${errorText}`);
    }
  }

  private stubSend(payload: FeedbackPayload): Promise<void> {
    return new Promise((resolve) => {
      console.log('[ReMarka] STUB — feedback payload:', JSON.stringify(payload, null, 2));
      setTimeout(resolve, STUB_DELAY_MS);
    });
  }
}
