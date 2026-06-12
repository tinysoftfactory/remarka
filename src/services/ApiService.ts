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
    const list = Array.isArray(body) ? body : body?.responses;
    if (!Array.isArray(list)) return [];

    return list
      .filter((item) => item && typeof item.id !== 'undefined' && typeof item.description === 'string')
      .map((item) => ({
        id: String(item.id),
        title: typeof item.title === 'string' ? item.title : undefined,
        description: item.description as string,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : undefined,
      }));
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
