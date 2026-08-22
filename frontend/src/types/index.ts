export type BehaviorClass = 'fixed' | 'periodic' | 'agile' | 'random' | 'intermittent';
export type PolicyType = 'baseline' | 'bandit' | 'q_learning' | 'dqn' | 'ppo';
export type DetectionType = 'TP' | 'FN' | 'FP' | 'TN';
export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface StandardEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  requestId: string;
}

export interface Simulation {
  id: string;
  name: string;
  bands: number;
  duration_steps: number;
  seed: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  created_at?: string;
}

export interface Emitter {
  id: string;
  simulation_id: string;
  behavior_class: BehaviorClass;
  band: number;
  period?: number;
  priority?: number;
}

export interface ReceiverConfig {
  bandwidth_k: number;
  dwell_ms: number;
  tuning_delay: number;
  threshold: number;
}

export interface ReceiverStatus {
  tuned_bands: number[];
  dwell_remaining: number;
}

export interface BandState {
  band_id: number;
  time_since_last_scan: number;
  recent_detection_rate_ewma: number;
  consecutive_misses: number;
  periodicity_phase: number;
  periodicity_confidence: number;
  band_priority_weight: number;
  tuning_cost_to_band: number;
}

export interface StateVector {
  bands: BandState[];
  receiver: {
    tuned_bands: number[];
    dwell_remaining_ms: number;
    tuning_delay_countdown_ms: number;
  };
}

export interface SchedulerStatus {
  policy: PolicyType;
  step_count: number;
}

export interface SchedulerDecision {
  action: {
    next_band: number;
    dwell_time?: number;
  };
  model_id?: string;
  decision_id: string;
}

export interface DecisionLogEntry {
  decision_id: string;
  simulation_id: string;
  timestamp: string;
  state: StateVector;
  action: {
    next_band: number;
    dwell_time?: number;
  };
  reward: number;
  model_id?: string;
}

export interface ModelMetadata {
  id: string;
  algorithm: PolicyType;
  version: string;
  active: boolean;
  hyperparams: Record<string, any>;
  created_at: string;
  metrics?: Record<string, number>;
}

export interface Experiment {
  id: string;
  scenario: ScenarioId;
  policies: PolicyType[];
  status: 'draft' | 'running' | 'completed' | 'failed';
}

export interface ExperimentResults {
  experiment_id: string;
  results: Record<PolicyType, {
    pd: number;
    pfa: number;
    latency: number;
    ait?: number;
    hpdr?: number;
  }>;
}

export interface LiveMetrics {
  simulation_id: string;
  step: number;
  pd: number;
  pfa: number;
  latency: number;
  ait: number;
  scan_efficiency: number;
}

// WS Event Types
export interface WSEventMap {
  connection_ack: { client_id: string };
  spectrum_update: {
    simulation_id: string;
    timestamp: number;
    step: number;
    band_occupancy: Record<number, boolean>;
    tuned_bands: number[];
  };
  scan_decision: {
    simulation_id: string;
    step: number;
    decision: SchedulerDecision;
  };
  detection_event: {
    simulation_id: string;
    step: number;
    band_id: number;
    detection_type: DetectionType;
    latency_ms?: number;
  };
  metrics_update: LiveMetrics;
  training_progress: {
    job_id: string;
    status: 'running' | 'done' | 'failed';
    progress: number;
    current_episode?: number;
    mean_reward?: number;
  };
  error: {
    code: string;
    message: string;
  };
}

export type WSEventType = keyof WSEventMap;

export interface WSEventEnvelope<T extends WSEventType = WSEventType> {
  type: T;
  data: WSEventMap[T];
}
