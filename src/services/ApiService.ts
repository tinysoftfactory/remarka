import { FeedbackPayload } from '../types';

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

  private stubSend(payload: FeedbackPayload): Promise<void> {
    return new Promise((resolve) => {
      console.log('[ReMarka] STUB — feedback payload:', JSON.stringify(payload, null, 2));
      setTimeout(resolve, STUB_DELAY_MS);
    });
  }
}
