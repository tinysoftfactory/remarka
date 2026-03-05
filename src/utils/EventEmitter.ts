type Handler<T = unknown> = (payload: T) => void;

export class SimpleEventEmitter {
  private listeners: Map<string, Set<Handler<unknown>>> = new Map();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: Handler<T>): void {
    this.listeners.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<T>(event: string, payload?: T): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload as unknown));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
