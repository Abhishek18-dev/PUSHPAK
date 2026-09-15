import type { WSEventEnvelope, WSEventMap, WSEventType } from '../../types';

type EventHandler<T extends WSEventType> = (data: WSEventMap[T]) => void;

class DesktopWebSocketService {
  private ws: WebSocket | null = null;
  private url: string = 'ws://127.0.0.1:8080/ws';
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;

  public connect(customUrl?: string) {
    if (customUrl) this.url = customUrl;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const envelope: WSEventEnvelope = JSON.parse(event.data);
          if (envelope.type === 'ping' || (envelope as any).type === 'ping') {
            this.send({ type: 'pong' });
            return;
          }
          this.emit(envelope.type, envelope.data);
        } catch (err) {
          // ignore malformed frame
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  public on<T extends WSEventType>(eventType: T, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  private emit<T extends WSEventType>(eventType: T, data: WSEventMap[T]) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          // preserve listener loop
        }
      });
    }
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const wsService = new DesktopWebSocketService();
