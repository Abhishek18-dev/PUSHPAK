import { apiClient } from '../services/api/apiClient';
import { wsService } from '../services/api/websocket';
import { authManager } from '../services/api/authInterceptor';
import type {
  Simulation,
  Emitter,
  ReceiverConfig,
  SchedulerDecision,
  DecisionLogEntry,
  ModelMetadata,
  Experiment,
  ExperimentResults,
  LiveMetrics,
  AuditEvent,
  PolicyType,
} from '../types';

type Listener = () => void;

interface AppState {
  // Navigation
  activeTab: string;

  // Auth & Session
  isAuthenticated: boolean;
  currentUser: { username: string; role: string } | null;

  // Simulations
  simulations: Simulation[];
  activeSimulationId: string | null;
  activeSimulation: Simulation | null;
  emitters: Emitter[];
  receiverConfig: ReceiverConfig;

  // Spectrum & Telemetry
  bandOccupancy: Record<string, boolean>;
  tunedBands: number[];
  waterfallHistory: Array<{ step: number; occupancy: Record<string, boolean> }>;

  // Scheduler
  activePolicy: PolicyType;
  latestDecision: SchedulerDecision | null;
  decisionHistory: DecisionLogEntry[];

  // Models & AI/ML
  models: ModelMetadata[];
  trainingStatus: { jobId: string; progress: number; status: string; reward?: number } | null;

  // Experiments
  experiments: Experiment[];
  activeExperiment: Experiment | null;
  experimentResults: ExperimentResults | null;

  // Live Metrics
  liveMetrics: LiveMetrics;

  // Audit
  auditLogs: AuditEvent[];

  // Real-time status
  isWsConnected: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  activeTab: 'dashboard',
  isAuthenticated: true, // Default local session for single workstation
  currentUser: { username: 'DRDO_OPERATOR_1', role: 'RESEARCHER' },

  simulations: [],
  activeSimulationId: null,
  activeSimulation: null,
  emitters: [],
  receiverConfig: {
    bandwidth_k: 1,
    dwell_ms: 10,
    tuning_delay: 2,
    threshold: 0.5,
  },

  bandOccupancy: {},
  tunedBands: [0],
  waterfallHistory: [],

  activePolicy: 'bandit',
  latestDecision: null,
  decisionHistory: [],

  models: [],
  trainingStatus: null,

  experiments: [],
  activeExperiment: null,
  experimentResults: null,

  liveMetrics: {
    step: 0,
    pd: 0.885,
    pfa: 0.042,
    reward: 124.5,
    ait: 10.2,
    scan_efficiency: 0.68,
  },

  auditLogs: [],
  isWsConnected: false,
  loading: false,
  error: null,
};

class DesktopStore {
  private state: AppState = { ...initialState };
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initWebSocket();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public setState(updater: Partial<AppState> | ((prev: AppState) => Partial<AppState>)) {
    const nextState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...nextState };
    this.notify();
  }

  public setActiveTab(tab: string) {
    this.setState({ activeTab: tab });
  }

  public setPolicy(policy: PolicyType) {
    this.setState({ activePolicy: policy });
    apiClient.scheduler.setPolicy(policy).catch(() => {});
  }

  public async ensureDefaultSimulation(): Promise<string | null> {
    try {
      const listRes = await apiClient.simulations.list();
      if (listRes.success && listRes.data && listRes.data.length > 0) {
        const active = listRes.data[0];
        this.setState({
          simulations: listRes.data,
          activeSimulation: active,
          activeSimulationId: active.id,
        });
        await this.fetchEmitters(active.id);
        return active.id;
      }

      // Auto-create default Scenario-A benchmark
      const createRes = await apiClient.simulations.create({
        name: 'Scenario-A (Multi-Emitter Benchmark)',
        bands: 16,
        duration_steps: 2000,
        seed: 42,
      });

      if (createRes.success && createRes.data?.id) {
        const simId = createRes.data.id;
        // Deploy standard 5 emitter behavior classes
        await Promise.allSettled([
          apiClient.emitters.create({ simulation_id: simId, behavior_class: 'periodic', band: 2, period: 8, priority: 1 }),
          apiClient.emitters.create({ simulation_id: simId, behavior_class: 'agile', band: 5, period: 10, priority: 2 }),
          apiClient.emitters.create({ simulation_id: simId, behavior_class: 'fixed', band: 8, priority: 1 }),
          apiClient.emitters.create({ simulation_id: simId, behavior_class: 'random', band: 11, priority: 1 }),
          apiClient.emitters.create({ simulation_id: simId, behavior_class: 'intermittent', band: 14, priority: 2 }),
        ]);

        const refreshed = await apiClient.simulations.list();
        if (refreshed.success && refreshed.data) {
          const createdSim = refreshed.data.find((s) => s.id === simId) || refreshed.data[0];
          this.setState({
            simulations: refreshed.data,
            activeSimulation: createdSim,
            activeSimulationId: createdSim.id,
          });
          await this.fetchEmitters(createdSim.id);
          return createdSim.id;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async fetchSimulations() {
    this.setState({ loading: true });
    const res = await apiClient.simulations.list();
    if (res.success && res.data && res.data.length > 0) {
      this.setState({
        simulations: res.data,
        activeSimulation: res.data[0] || null,
        activeSimulationId: res.data[0]?.id || null,
        loading: false,
      });
      if (res.data[0]?.id) {
        this.fetchEmitters(res.data[0].id);
      }
    } else {
      this.setState({ loading: false });
      await this.ensureDefaultSimulation();
    }
  }

  public async fetchEmitters(simId: string) {
    const res = await apiClient.emitters.list(simId);
    if (res.success && res.data) {
      this.setState({ emitters: res.data });
    }
  }

  public async fetchModels() {
    const res = await apiClient.models.list();
    if (res.success && res.data) {
      this.setState({ models: res.data });
    }
  }

  public async fetchExperiments() {
    const res = await apiClient.experiments.list();
    if (res.success && res.data) {
      this.setState({ experiments: res.data });
    }
  }

  public async fetchAuditLogs() {
    const res = await apiClient.audit.getAuditLog(50);
    if (res.success && res.data) {
      this.setState({ auditLogs: res.data });
    }
  }

  public async runExperiment(expId: string) {
    this.setState({ loading: true });
    await apiClient.experiments.run(expId);
    // Fetch real metrics result
    const compRes = await apiClient.experiments.getComparison(expId);
    if (compRes.success && compRes.data) {
      this.setState({ experimentResults: compRes.data, loading: false });
    } else {
      this.setState({ loading: false });
    }
  }

  private initWebSocket() {
    wsService.connect();

    wsService.on('connection_ack', () => {
      this.setState({ isWsConnected: true });
    });

    wsService.on('spectrum_update', (data) => {
      this.setState((prev) => {
        const newHistory = [
          { step: prev.liveMetrics.step, occupancy: data.band_occupancy },
          ...prev.waterfallHistory.slice(0, 39),
        ];
        return {
          bandOccupancy: data.band_occupancy,
          tunedBands: data.tuned_bands || prev.tunedBands,
          waterfallHistory: newHistory,
        };
      });
    });

    wsService.on('scan_decision', (data) => {
      const decision: SchedulerDecision = {
        action: { next_band: data.band },
        decision_id: `dec_${Date.now()}`,
      };
      this.setState((prev) => ({
        latestDecision: decision,
        decisionHistory: [
          {
            decision_id: decision.decision_id,
            simulation_id: prev.activeSimulationId || '',
            timestamp: new Date().toLocaleTimeString(),
            state: null as any,
            action: decision.action,
            reward: prev.liveMetrics.reward,
          },
          ...prev.decisionHistory.slice(0, 49),
        ],
      }));
    });

    wsService.on('metrics_update', (data) => {
      this.setState({ liveMetrics: data });
    });
  }
}

export const store = new DesktopStore();
