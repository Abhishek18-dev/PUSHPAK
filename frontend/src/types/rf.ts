export type BehaviorClass = 'fixed' | 'periodic' | 'agile' | 'random' | 'intermittent';
export type PolicyType = 'baseline' | 'bandit' | 'q_learning' | 'dqn' | 'ppo';
export type DetectionType = 'TP' | 'FN' | 'FP' | 'TN';
export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface FrequencyBandState {
  band_id: number;
  center_freq_mhz: number;
  is_active: boolean; // Ground truth
  emitter_type?: BehaviorClass;
  priority: number;
  time_since_last_scan: number;
  recent_detection_rate_ewma: number;
  consecutive_misses: number;
  periodicity_phase: number;
  periodicity_confidence: number;
  band_priority_weight: number;
  tuning_cost_to_band: number;
}

export interface ReceiverConfig {
  bandwidth_k: number;
  dwell_ms: number;
  tuning_delay_ms: number;
  threshold_snr: number;
  tuned_bands: number[];
  dwell_remaining_ms: number;
}

export interface EmitterConfig {
  id: string;
  simulation_id: string;
  behavior_class: BehaviorClass;
  band: number;
  period_steps?: number;
  duty_cycle?: number;
  priority: number;
}

export interface MetricsSummary {
  pd: number; // Probability of Detection TP/(TP+FN)
  pfa: number; // Probability of False Alarm FP/(FP+TN)
  ait: number; // Average Intercept Time
  latency_ms: number;
  scan_efficiency: number; // Useful scans / total scans
  cumulative_reward: number;
  hpdr: number; // High Priority Detection Rate
  precision: number;
  recall: number;
  f1: number;
  total_scans: number;
  useful_scans: number;
  tp_count: number;
  fp_count: number;
  fn_count: number;
  tn_count: number;
}

export interface DecisionLogEntry {
  step: number;
  scanned_bands: number[];
  policy_used: PolicyType;
  reward: number;
  detection_type: DetectionType;
  target_band_active: boolean;
  timestamp: string;
}

export interface SimulationState {
  id: string;
  name: string;
  bands: number;
  duration_steps: number;
  current_step: number;
  seed: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  policy: PolicyType;
  receiver: ReceiverConfig;
  spectrum_bands: FrequencyBandState[];
  emitters: EmitterConfig[];
  metrics_baseline: MetricsSummary;
  metrics_ml: MetricsSummary;
  history: DecisionLogEntry[];
}

export interface WsEventEnvelope {
  type: 'spectrum_update' | 'scan_decision' | 'detection_event' | 'metrics_update' | 'training_progress' | 'error';
  timestamp: number;
  simulation_id: string;
  data: any;
}
