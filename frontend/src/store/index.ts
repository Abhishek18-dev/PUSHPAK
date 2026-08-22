import { create } from 'zustand';
import { WebSocketClient } from '../services/websocket';
import { api } from '../services/api';
import type { Simulation, LiveMetrics, SchedulerDecision, Emitter, ModelMetadata, Experiment, ExperimentResults } from '../types';

interface AppState {
  // Simulations list
  simulations: Simulation[];
  activeSimulationId: string | null;
  activeSimulation: Simulation | null;
  loading: boolean;
  errorMsg: string | null;

  // WS Connection
  wsClient: WebSocketClient | null;
  wsState: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  wsLogs: string[];

  // Live simulation data feed
  bandOccupancy: Record<number, boolean>;
  tunedBands: number[];
  latestDecision: SchedulerDecision | null;
  decisionHistory: SchedulerDecision[];
  detections: any[];
  liveMetrics: LiveMetrics | null;
  trainingProgress: { job_id: string; status: string; progress: number } | null;

  // Extra loaded states for UI
  emitters: Emitter[];
  models: ModelMetadata[];
  experiments: Experiment[];
  activeResults: ExperimentResults | null;

  // Actions
  fetchSimulations: () => Promise<void>;
  setActiveSimulation: (id: string | null) => void;
  createSimulation: (name: string, bands: number, duration: number, seed: number) => Promise<boolean>;
  deleteSimulation: (id: string) => Promise<void>;
  updateSimulationStatus: (id: string, status: Simulation['status']) => void;
  
  // WS action triggers
  connectWS: (simulationId: string) => void;
  disconnectWS: () => void;
  clearWSLogs: () => void;

  // Actions for Emitters & Receiver
  fetchEmitters: () => Promise<void>;
  createEmitter: (data: any) => Promise<boolean>;
  deleteEmitter: (id: string) => Promise<void>;
  
  // Models & Experiments
  fetchModels: () => Promise<void>;
  fetchExperiments: () => Promise<void>;
  fetchExperimentResults: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  simulations: [],
  activeSimulationId: null,
  activeSimulation: null,
  loading: false,
  errorMsg: null,
  
  wsClient: null,
  wsState: 'DISCONNECTED',
  wsLogs: [],

  bandOccupancy: {},
  tunedBands: [],
  latestDecision: null,
  decisionHistory: [],
  detections: [],
  liveMetrics: null,
  trainingProgress: null,

  emitters: [],
  models: [],
  experiments: [],
  activeResults: null,

  fetchSimulations: async () => {
    set({ loading: true, errorMsg: null });
    const res = await api.simulations.list();
    if (res.success && res.data) {
      set({ simulations: res.data, loading: false });
    } else {
      set({ errorMsg: res.error?.message || 'Failed to fetch simulations', loading: false });
    }
  },

  setActiveSimulation: (id) => {
    const { connectWS, disconnectWS } = get();
    if (!id) {
      disconnectWS();
      set({
        activeSimulationId: null,
        activeSimulation: null,
        bandOccupancy: {},
        tunedBands: [],
        latestDecision: null,
        decisionHistory: [],
        detections: [],
        liveMetrics: null,
      });
      return;
    }

    const sim = get().simulations.find(s => s.id === id) || null;
    set({
      activeSimulationId: id,
      activeSimulation: sim,
      bandOccupancy: {},
      tunedBands: [],
      latestDecision: null,
      decisionHistory: [],
      detections: [],
      liveMetrics: null,
    });

    connectWS(id);
  },

  createSimulation: async (name, bands, duration, seed) => {
    set({ loading: true, errorMsg: null });
    const res = await api.simulations.create({ name, bands, duration_steps: duration, seed });
    if (res.success && res.data) {
      await get().fetchSimulations();
      return true;
    } else {
      set({ errorMsg: res.error?.message || 'Failed to create simulation', loading: false });
      return false;
    }
  },

  deleteSimulation: async (id) => {
    set({ loading: true, errorMsg: null });
    const res = await api.simulations.delete(id);
    if (res.success) {
      if (get().activeSimulationId === id) {
        get().setActiveSimulation(null);
      }
      await get().fetchSimulations();
    } else {
      set({ errorMsg: res.error?.message || 'Failed to delete simulation', loading: false });
    }
  },

  updateSimulationStatus: (id, status) => {
    set(state => {
      const simulations = state.simulations.map(s => s.id === id ? { ...s, status } : s);
      const activeSimulation = state.activeSimulationId === id && state.activeSimulation
        ? { ...state.activeSimulation, status }
        : state.activeSimulation;
      return { simulations, activeSimulation };
    });
  },

  connectWS: (simulationId) => {
    const { disconnectWS } = get();
    disconnectWS();

    const client = new WebSocketClient(simulationId);
    
    client.onStateChange = (wsState) => {
      set({ wsState });
    };

    client.logRawMessage = (msg) => {
      set(state => ({
        wsLogs: [msg, ...state.wsLogs].slice(0, 100) // Keep last 100 log lines
      }));
    };

    // Subscriptions
    client.subscribe('spectrum_update', (data) => {
      set({
        bandOccupancy: data.band_occupancy,
        tunedBands: data.tuned_bands,
      });
    });

    client.subscribe('scan_decision', (data) => {
      set(state => ({
        latestDecision: data.decision,
        decisionHistory: [data.decision, ...state.decisionHistory].slice(0, 50),
      }));
    });

    client.subscribe('detection_event', (data) => {
      set(state => ({
        detections: [data, ...state.detections].slice(0, 50),
      }));
    });

    client.subscribe('metrics_update', (data) => {
      set({ liveMetrics: data });
    });

    client.subscribe('training_progress', (data) => {
      set({ trainingProgress: data });
    });

    client.subscribe('error', (data) => {
      set({ errorMsg: `WS Error: ${data.message} (${data.code})` });
    });

    client.connect();
    set({ wsClient: client, wsLogs: [] });
  },

  disconnectWS: () => {
    const { wsClient } = get();
    if (wsClient) {
      wsClient.disconnect();
    }
    set({ wsClient: null, wsState: 'DISCONNECTED' });
  },

  clearWSLogs: () => {
    set({ wsLogs: [] });
  },

  fetchEmitters: async () => {
    // Emitters are typically scoped to a simulation, but standard CRUD might fetch lists
    // Let's assume list of emitters can be simulated or is loaded via config if needed.
    // For test harness, let's keep list in state.
  },

  createEmitter: async (data) => {
    const res = await api.emitters.create(data);
    if (res.success) {
      // Reload emitters or active simulation details if needed
      return true;
    } else {
      set({ errorMsg: res.error?.message || 'Failed to create emitter' });
      return false;
    }
  },

  deleteEmitter: async (id) => {
    const res = await api.emitters.delete(id);
    if (!res.success) {
      set({ errorMsg: res.error?.message || 'Failed to delete emitter' });
    }
  },

  fetchModels: async () => {
    const res = await api.models.list();
    if (res.success && res.data) {
      set({ models: res.data });
    }
  },

  fetchExperiments: async () => {
    const res = await api.experiments.list();
    if (res.success && res.data) {
      set({ experiments: res.data });
    }
  },

  fetchExperimentResults: async (id) => {
    const res = await api.experiments.getResults(id);
    if (res.success && res.data) {
      set({ activeResults: res.data });
    }
  }
}));
