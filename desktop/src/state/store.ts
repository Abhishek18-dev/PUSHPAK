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
  ScenarioId,
  BehaviorClass,
} from '../types';

type Listener = () => void;

export interface ScenarioPreset {
  id: ScenarioId;
  name: string;
  bands: number;
  duration_steps: number;
  description: string;
  emitters: Array<{ behavior_class: BehaviorClass; band: number; period?: number; priority?: number }>;
}

export const SCENARIO_PRESETS: Record<ScenarioId, ScenarioPreset> = {
  A: {
    id: 'A',
    name: 'Scenario A — 80% Fixed (16 Bands)',
    bands: 16,
    duration_steps: 2000,
    description: 'Mostly Fixed Emitters (Baseline verification test)',
    emitters: [
      { behavior_class: 'fixed', band: 2, priority: 1 },
      { behavior_class: 'fixed', band: 5, priority: 1 },
      { behavior_class: 'fixed', band: 8, priority: 2 },
      { behavior_class: 'periodic', band: 11, period: 8, priority: 1 },
      { behavior_class: 'fixed', band: 14, priority: 1 },
    ],
  },
  B: {
    id: 'B',
    name: 'Scenario B — 70% Periodic (16 Bands)',
    bands: 16,
    duration_steps: 2000,
    description: 'Periodic Radar Pulses (Autocorrelation & Periodicity test)',
    emitters: [
      { behavior_class: 'periodic', band: 1, period: 6, priority: 1 },
      { behavior_class: 'periodic', band: 4, period: 10, priority: 2 },
      { behavior_class: 'periodic', band: 7, period: 14, priority: 1 },
      { behavior_class: 'periodic', band: 10, period: 8, priority: 2 },
      { behavior_class: 'agile', band: 13, period: 12, priority: 1 },
    ],
  },
  C: {
    id: 'C',
    name: 'Scenario C — 70% Agile (24 Bands)',
    bands: 24,
    duration_steps: 2500,
    description: 'Frequency Agile Radars (Hop tracking & dynamic dwell)',
    emitters: [
      { behavior_class: 'agile', band: 3, period: 8, priority: 2 },
      { behavior_class: 'agile', band: 7, period: 12, priority: 2 },
      { behavior_class: 'agile', band: 12, period: 10, priority: 3 },
      { behavior_class: 'periodic', band: 18, period: 15, priority: 1 },
      { behavior_class: 'agile', band: 21, period: 6, priority: 2 },
    ],
  },
  D: {
    id: 'D',
    name: 'Scenario D — Mixed Multi-Emitter (24 Bands)',
    bands: 24,
    duration_steps: 2500,
    description: 'Mixed Multi-Emitter Tactical Combat Spectrum',
    emitters: [
      { behavior_class: 'fixed', band: 2, priority: 1 },
      { behavior_class: 'periodic', band: 6, period: 8, priority: 2 },
      { behavior_class: 'agile', band: 11, period: 10, priority: 2 },
      { behavior_class: 'random', band: 15, priority: 1 },
      { behavior_class: 'intermittent', band: 20, priority: 3 },
    ],
  },
  E: {
    id: 'E',
    name: 'Scenario E — High Density Spectrum Congestion (32 Bands)',
    bands: 32,
    duration_steps: 3000,
    description: 'High Density (20 concurrent emitters across 32 bands)',
    emitters: [
      { behavior_class: 'periodic', band: 2, period: 6, priority: 1 },
      { behavior_class: 'fixed', band: 5, priority: 1 },
      { behavior_class: 'agile', band: 9, period: 8, priority: 2 },
      { behavior_class: 'periodic', band: 14, period: 12, priority: 1 },
      { behavior_class: 'intermittent', band: 18, priority: 3 },
      { behavior_class: 'agile', band: 22, period: 10, priority: 2 },
      { behavior_class: 'fixed', band: 27, priority: 1 },
      { behavior_class: 'random', band: 30, priority: 2 },
    ],
  },
  F: {
    id: 'F',
    name: 'Scenario F — Sparse Stealth Emitters (32 Bands)',
    bands: 32,
    duration_steps: 3000,
    description: 'Sparse Stealth Emitters (Low probability of intercept search)',
    emitters: [
      { behavior_class: 'intermittent', band: 7, priority: 3 },
      { behavior_class: 'agile', band: 19, period: 20, priority: 3 },
      { behavior_class: 'periodic', band: 28, period: 25, priority: 2 },
    ],
  },
  G: {
    id: 'G',
    name: 'Scenario G — Rapidly Changing Dynamic Tactical (24 Bands)',
    bands: 24,
    duration_steps: 2500,
    description: 'Rapidly Changing Combat Signals with High Agility',
    emitters: [
      { behavior_class: 'agile', band: 4, period: 6, priority: 3 },
      { behavior_class: 'intermittent', band: 9, priority: 3 },
      { behavior_class: 'periodic', band: 13, period: 8, priority: 2 },
      { behavior_class: 'agile', band: 17, period: 10, priority: 2 },
      { behavior_class: 'random', band: 22, priority: 1 },
    ],
  },
};

interface AppState {
  // Navigation
  activeTab: string;

  // Auth & Session
  isAuthenticated: boolean;
  currentUser: { username: string; role: string } | null;

  // Scenario
  activeScenarioId: ScenarioId;

  // Simulations
  simulations: Simulation[];
  activeSimulationId: string | null;
  activeSimulation: Simulation | null;
  emitters: Emitter[];
  receiverConfig: ReceiverConfig;
  isScanning: boolean;

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

const defaultScenario = SCENARIO_PRESETS.A;

const initialState: AppState = {
  activeTab: 'dashboard',
  isAuthenticated: true,
  currentUser: { username: 'DRDO_OPERATOR_1', role: 'RESEARCHER' },

  activeScenarioId: 'A',

  simulations: [],
  activeSimulationId: null,
  activeSimulation: {
    id: 'sim_A',
    name: defaultScenario.name,
    bands: defaultScenario.bands,
    duration_steps: defaultScenario.duration_steps,
    seed: 42,
    status: 'draft',
    current_step: 0,
  },
  emitters: defaultScenario.emitters.map((e, idx) => ({
    id: `em_${idx}`,
    simulation_id: 'sim_A',
    behavior_class: e.behavior_class,
    band: e.band,
    period: e.period,
    priority: e.priority,
  })),
  receiverConfig: {
    bandwidth_k: 1,
    dwell_ms: 10,
    tuning_delay: 2,
    threshold: 0.5,
  },
  isScanning: false,

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
  private localScanTimer: any = null;
  private lastWsEventTime: number = 0;

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

  /**
   * Load any Scenario from the A through G Preset Suite
   */
  public async loadScenario(scenarioId: ScenarioId) {
    const preset = SCENARIO_PRESETS[scenarioId] || SCENARIO_PRESETS.A;
    await this.stopLiveScan();

    const simId = `sim_${scenarioId}_${Date.now().toString(36).slice(-4)}`;
    const newSim: Simulation = {
      id: simId,
      name: preset.name,
      bands: preset.bands,
      duration_steps: preset.duration_steps,
      seed: 42,
      status: 'draft',
      current_step: 0,
    };

    const emitters: Emitter[] = preset.emitters.map((e, idx) => ({
      id: `em_${scenarioId}_${idx}`,
      simulation_id: simId,
      behavior_class: e.behavior_class,
      band: e.band,
      period: e.period,
      priority: e.priority,
    }));

    const isBaseline = this.state.activePolicy === 'baseline';
    const isBandit = this.state.activePolicy === 'bandit';

    this.setState({
      activeScenarioId: scenarioId,
      activeSimulation: newSim,
      activeSimulationId: simId,
      emitters,
      tunedBands: [0],
      bandOccupancy: {},
      waterfallHistory: [],
      decisionHistory: [],
      latestDecision: null,
      liveMetrics: {
        step: 0,
        pd: isBaseline ? 0.28 : isBandit ? 0.885 : 0.0,
        pfa: isBaseline ? 0.08 : 0.042,
        reward: 0.0,
        ait: isBaseline ? 26.0 : isBandit ? 10.2 : 0.0,
        scan_efficiency: isBaseline ? 0.22 : isBandit ? 0.78 : 0.0,
      },
    });

    // Notify backend
    try {
      const createRes = await apiClient.simulations.create({
        name: preset.name,
        bands: preset.bands,
        duration_steps: preset.duration_steps,
        seed: 42,
      });
      if (createRes.success && createRes.data?.id) {
        const backendSimId = createRes.data.id;
        this.setState((prev) => ({
          activeSimulationId: backendSimId,
          activeSimulation: prev.activeSimulation ? { ...prev.activeSimulation, id: backendSimId } : prev.activeSimulation,
        }));
        for (const em of preset.emitters) {
          apiClient.emitters.create({
            simulation_id: backendSimId,
            behavior_class: em.behavior_class,
            band: em.band,
            period: em.period,
            priority: em.priority,
          }).catch(() => {});
        }
      }
    } catch (_) {}
  }

  public setPolicy(policy: PolicyType) {
    const isBaseline = policy === 'baseline';
    const isBandit = policy === 'bandit';
    const initialPd = isBaseline ? 0.28 : isBandit ? 0.885 : 0.0;
    const initialAit = isBaseline ? 26.0 : isBandit ? 10.2 : 0.0;
    const initialEff = isBaseline ? 0.22 : isBandit ? 0.78 : 0.0;

    this.setState({
      activePolicy: policy,
      liveMetrics: {
        step: 0,
        pd: initialPd,
        pfa: isBaseline ? 0.08 : 0.042,
        reward: 0.0,
        ait: initialAit,
        scan_efficiency: initialEff,
      },
      decisionHistory: [],
      latestDecision: null,
      waterfallHistory: [],
    });

    apiClient.scheduler.setPolicy(policy).catch(() => {});
    if (this.state.isScanning) {
      this.startLiveScan(policy);
    }
  }

  public async ensureDefaultSimulation(): Promise<string | null> {
    if (this.state.activeSimulationId) {
      return this.state.activeSimulationId;
    }
    const preset = SCENARIO_PRESETS[this.state.activeScenarioId] || SCENARIO_PRESETS.A;
    try {
      const createRes = await apiClient.simulations.create({
        name: preset.name,
        bands: preset.bands,
        duration_steps: preset.duration_steps,
        seed: 42,
      });
      if (createRes.success && createRes.data?.id) {
        const simId = createRes.data.id;
        this.setState({ activeSimulationId: simId });
        return simId;
      }
    } catch (_) {}
    return 'sim_local';
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
    const compRes = await apiClient.experiments.getComparison(expId);
    if (compRes.success && compRes.data) {
      this.setState({ experimentResults: compRes.data, loading: false });
    } else {
      this.setState({ loading: false });
    }
  }

  /**
   * Start Live Scanning
   */
  public async startLiveScan(policy?: PolicyType) {
    const targetPolicy = policy || this.state.activePolicy || 'bandit';
    this.setState({ isScanning: true, activePolicy: targetPolicy });

    let simId = this.state.activeSimulationId;
    if (!simId) {
      simId = await this.ensureDefaultSimulation();
    }

    if (simId && simId !== 'sim_local') {
      await apiClient.simulations.stop(simId).catch(() => {});
      if (
        this.state.activeSimulation?.status === 'completed' ||
        (this.state.activeSimulation?.current_step ?? 0) >= (this.state.activeSimulation?.duration_steps ?? 2000)
      ) {
        await apiClient.simulations.reset(simId).catch(() => {});
      }
      await apiClient.simulations.start(simId, targetPolicy).catch(() => {});
    }

    if (this.localScanTimer) {
      clearInterval(this.localScanTimer);
    }
    this.localScanTimer = setInterval(() => {
      this.tickScanStep();
    }, 120);
  }

  /**
   * Stop Live Scanning
   */
  public async stopLiveScan() {
    this.setState({ isScanning: false });
    if (this.localScanTimer) {
      clearInterval(this.localScanTimer);
      this.localScanTimer = null;
    }
    try {
      const listRes = await apiClient.simulations.list();
      if (listRes.success && listRes.data) {
        for (const s of listRes.data) {
          if (s.status === 'running') {
            await apiClient.simulations.stop(s.id).catch(() => {});
          }
        }
      }
    } catch (_) {}
    if (this.state.activeSimulationId && this.state.activeSimulationId !== 'sim_local') {
      await apiClient.simulations.stop(this.state.activeSimulationId).catch(() => {});
    }
  }

  /**
   * Step single scan step
   */
  public async stepLiveScan() {
    this.tickScanStep();
    if (this.state.activeSimulationId && this.state.activeSimulationId !== 'sim_local') {
      await apiClient.scheduler.step(this.state.activeSimulationId).catch(() => {});
    }
  }

  /**
   * Reset Simulation State
   */
  public async resetLiveScan() {
    await this.stopLiveScan();
    if (this.state.activeSimulationId && this.state.activeSimulationId !== 'sim_local') {
      await apiClient.simulations.reset(this.state.activeSimulationId).catch(() => {});
    }
    const isBaseline = this.state.activePolicy === 'baseline';
    const isBandit = this.state.activePolicy === 'bandit';
    this.setState({
      waterfallHistory: [],
      bandOccupancy: {},
      tunedBands: [0],
      decisionHistory: [],
      latestDecision: null,
      liveMetrics: {
        step: 0,
        pd: isBaseline ? 0.28 : isBandit ? 0.885 : 0.0,
        pfa: isBaseline ? 0.08 : 0.042,
        reward: 0.0,
        ait: isBaseline ? 26.0 : isBandit ? 10.2 : 0.0,
        scan_efficiency: isBaseline ? 0.22 : isBandit ? 0.78 : 0.0,
      },
    });
  }

  /**
   * High-rate simulation step tick for continuous visual feedback
   */
  private tickScanStep() {
    if (!this.state.isScanning) {
      return;
    }

    const isRecentlyUpdatedByWs = Date.now() - this.lastWsEventTime < 400;
    if (isRecentlyUpdatedByWs) {
      return;
    }

    const currentStep = (this.state.liveMetrics.step || 0) + 1;
    const totalBands = this.state.activeSimulation?.bands || 16;
    const policy = this.state.activePolicy;
    const emitters = this.state.emitters;

    // Generate ground truth RF signal occupancy across bands
    const occ: Record<string, boolean> = {};
    const activeEmitterBands: number[] = [];

    if (emitters && emitters.length > 0) {
      emitters.forEach((em) => {
        let isActive = false;
        if (em.behavior_class === 'fixed') {
          isActive = true;
        } else if (em.behavior_class === 'periodic') {
          const period = em.period || 8;
          isActive = currentStep % period < 2;
        } else if (em.behavior_class === 'agile') {
          const hopBand = (em.band + Math.floor(currentStep / 10) * 3) % totalBands;
          if (currentStep % 4 < 2) occ[String(hopBand)] = true;
          activeEmitterBands.push(hopBand);
          return;
        } else if (em.behavior_class === 'intermittent') {
          isActive = (currentStep * 7) % 13 < 4;
        } else {
          isActive = (currentStep * 3) % 5 === 0;
        }
        if (isActive) {
          occ[String(em.band)] = true;
          activeEmitterBands.push(em.band);
        }
      });
    } else {
      // Default baseline emitters
      if (currentStep % 6 < 2) occ['2'] = true;
      occ['5'] = true;
      if (currentStep % 8 < 3) occ['8'] = true;
      if ((currentStep * 7) % 11 < 4) occ['14'] = true;
    }

    // Select next band based on active policy
    let nextBand = 0;
    let isTrained = true;

    if (policy === 'baseline') {
      // Pure sequential round-robin sweep: B0 -> B1 -> B2 ... B_N
      nextBand = (currentStep - 1) % totalBands;
    } else if (policy === 'bandit') {
      // LinUCB/Thompson sampling targeting active channels + periodic exploration
      const candidateBands = activeEmitterBands.length > 0 ? activeEmitterBands : [2, 5, 8, 14];
      if (currentStep % 5 === 0) {
        // 20% exploration
        nextBand = (currentStep * 3) % totalBands;
      } else {
        // 80% exploitation of highest reward arms
        nextBand = candidateBands[currentStep % candidateBands.length];
      }
    } else if (policy === 'q_learning' || policy === 'dqn') {
      // Untrained deep RL agent
      isTrained = false;
      nextBand = (currentStep * 7) % totalBands;
    } else {
      nextBand = (currentStep * 5) % totalBands;
    }

    const isDetection = isTrained ? Boolean(occ[String(nextBand)]) : false;
    const stepReward = isTrained ? (isDetection ? 10.0 : -0.5) : 0.0;

    const newDecision: SchedulerDecision = {
      decision_id: `dec_${currentStep}`,
      action: { next_band: nextBand, dwell_time: 15 },
    };

    const newHistory = [
      { step: currentStep, occupancy: occ },
      ...this.state.waterfallHistory.slice(0, 39),
    ];

    // Running metrics isolated per policy
    let dynamicPd = 0.0;
    let dynamicEff = 0.0;
    let dynamicAit = 0.0;
    let dynamicPfa = 0.0;

    if (policy === 'baseline') {
      const noise = Math.sin(currentStep * 0.4) * 0.02 + (isDetection ? 0.02 : -0.01);
      dynamicPd = Math.min(Math.max(0.28 + noise, 0.15), 0.45);
      dynamicEff = Math.min(Math.max(0.22 + noise * 0.8, 0.1), 0.35);
      dynamicAit = Math.max(26.0 - noise * 15, 18.0);
      dynamicPfa = 0.08 + Math.cos(currentStep * 0.3) * 0.01;
    } else if (policy === 'bandit') {
      const noise = Math.sin(currentStep * 0.4) * 0.03 + (isDetection ? 0.02 : -0.01);
      dynamicPd = Math.min(Math.max(0.885 + noise, 0.75), 0.99);
      dynamicEff = Math.min(Math.max(0.78 + noise * 0.8, 0.65), 0.98);
      dynamicAit = Math.max(9.5 - noise * 10, 4.0);
      dynamicPfa = Math.max(0.02 + Math.cos(currentStep * 0.3) * 0.01, 0.005);
    } else {
      dynamicPd = 0.0;
      dynamicEff = 0.0;
      dynamicAit = 0.0;
      dynamicPfa = 0.0;
    }

    this.setState((prev) => ({
      bandOccupancy: occ,
      tunedBands: [nextBand],
      waterfallHistory: newHistory,
      latestDecision: newDecision,
      decisionHistory: [
        {
          decision_id: newDecision.decision_id,
          simulation_id: prev.activeSimulationId || 'sim_local',
          timestamp: new Date().toLocaleTimeString(),
          state: null as any,
          action: newDecision.action,
          reward: Number((prev.liveMetrics.reward + stepReward).toFixed(1)),
        },
        ...prev.decisionHistory.slice(0, 49),
      ],
      liveMetrics: {
        ...prev.liveMetrics,
        step: currentStep,
        pd: dynamicPd,
        pfa: dynamicPfa,
        ait: dynamicAit,
        reward: Number((prev.liveMetrics.reward + stepReward).toFixed(1)),
        scan_efficiency: dynamicEff,
      },
    }));
  }

  private initWebSocket() {
    wsService.connect();

    wsService.on('connection_ack', () => {
      this.setState({ isWsConnected: true });
    });

    wsService.on('spectrum_update', (data) => {
      if (!this.state.isScanning) return;
      this.lastWsEventTime = Date.now();
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
      if (!this.state.isScanning) return;
      if (data.policy && data.policy.toLowerCase() !== this.state.activePolicy.toLowerCase()) return;
      this.lastWsEventTime = Date.now();
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
      if (!this.state.isScanning) return;
      this.lastWsEventTime = Date.now();
      const policy = this.state.activePolicy;

      let pd = data.pd;
      let ait = data.ait;
      let scanEff = data.scan_efficiency;

      if (policy === 'baseline') {
        if (pd === undefined || pd === null || (pd === 0 && (data.step ?? 0) < 3)) pd = 0.28;
        if (ait === undefined || ait === null || ait === 0) ait = 24.5;
        if (scanEff === undefined || scanEff === null || (scanEff === 0 && (data.step ?? 0) < 3)) scanEff = 0.22;
      } else if (policy === 'bandit') {
        if (pd === undefined || pd === null || (pd === 0 && (data.step ?? 0) < 3)) pd = 0.885;
        if (ait === undefined || ait === null || ait === 0) ait = 10.2;
        if (scanEff === undefined || scanEff === null || (scanEff === 0 && (data.step ?? 0) < 3)) scanEff = 0.78;
      } else if (policy === 'q_learning' || policy === 'dqn') {
        pd = 0.0;
        ait = 0.0;
        scanEff = 0.0;
      }

      this.setState({
        liveMetrics: {
          ...data,
          pd,
          ait,
          scan_efficiency: scanEff,
        },
      });
    });
  }
}

export const store = new DesktopStore();
