import type { WSEventEnvelope, WSEventMap, WSEventType } from '../../types';

type Listener<T extends WSEventType> = (data: WSEventMap[T]) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  public simulationId: string;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isClosedIntentional = false;
  private listeners: Partial<Record<WSEventType, Set<Listener<any>>>> = {};
  private mockConnectTimeout: any = null;
  
  public onStateChange: (state: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') => void = () => {};
  public logRawMessage: (msg: string) => void = () => {};

  constructor(simulationId: string) {
    const baseWsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080/ws/v1';
    this.url = `${baseWsUrl}/simulations/${simulationId}`;
    this.simulationId = simulationId;
    console.log(`Initialized WebSocketClient for simulation: ${this.simulationId}`);
  }

  public connect() {
    this.isClosedIntentional = false;
    this.onStateChange('CONNECTING');

    if ((window as any).__mockMode__) {
      this.mockConnectTimeout = setTimeout(() => {
        this.onStateChange('CONNECTED');
        const ack = { type: 'connection_ack', data: { client_id: 'client_mock' } };
        this.logRawMessage(JSON.stringify(ack));
      }, 500);
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.onStateChange('CONNECTED');
        this.reconnectDelay = 1000;
        this.subscribeToChannels();
      };

      this.ws.onmessage = (event) => {
        this.logRawMessage(event.data);
        try {
          const payload: WSEventEnvelope = JSON.parse(event.data);
          if (payload && payload.type) {
            const typeListeners = this.listeners[payload.type];
            if (typeListeners) {
              typeListeners.forEach(listener => listener(payload.data));
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.onStateChange('DISCONNECTED');
        if (!this.isClosedIntentional) {
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this.onStateChange('DISCONNECTED');
      this.reconnect();
    }
  }

  private subscribeToChannels() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const subscribeMsg = {
      action: 'subscribe',
      channels: ['spectrum', 'scheduler', 'metrics', 'training']
    };
    this.ws.send(JSON.stringify(subscribeMsg));
  }

  private reconnect() {
    console.log(`Reconnecting to WebSocket in ${this.reconnectDelay}ms...`);
    setTimeout(() => {
      if (this.isClosedIntentional) return;
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  public subscribe<T extends WSEventType>(type: T, listener: Listener<T>): () => void {
    if (!this.listeners[type]) {
      this.listeners[type] = new Set();
    }
    this.listeners[type]!.add(listener);
    return () => {
      this.listeners[type]?.delete(listener);
    };
  }

  public disconnect() {
    this.isClosedIntentional = true;
    if (this.mockConnectTimeout) {
      clearTimeout(this.mockConnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStateChange('DISCONNECTED');
  }
}
