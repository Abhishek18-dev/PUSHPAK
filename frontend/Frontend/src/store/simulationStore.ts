import { create } from 'zustand';
import { SimulationState, FrequencyBandState, PolicyType, MetricsSummary, DecisionLogEntry, BehaviorClass, ScenarioId, EmitterConfig } from '../types/rf';

interface StateStore {
  simulation: SimulationState;
  selectedBand: number | null;
  waterfallHistory: boolean[][]; // [step][band_id]
  wsConnected: boolean;
  wsLog: string[];
  
  // Actions
  setPolicy: (policy: PolicyType) => void;
  setBandwidthK: (k: number) => void;
  setSelectedBand: (band: number | null) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  loadScenario: (scenarioId: ScenarioId) => void;
  addEmitter: (behavior: BehaviorClass, band: number, priority: number) => void;
}

const initialMetrics: MetricsSummary = {
  pd: 0,
  pfa: 0,
  ait: 0,
  latency_ms: 0,
  scan_efficiency: 0,
  cumulative_reward: 0,
  hpdr: 0,
  precision: 0,
  recall: 0,
  f1: 0,
  total_scans: 0,
  useful_scans: 0,
  tp_count: 0,
  fp_count: 0,
  fn_count: 0,
  tn_count: 0,
};

function generateInitialBands(count: number): FrequencyBandState[] {
  return Array.from({ length: count }, (_, i) => ({
    band_id: i,
    center_freq_mhz: 2400 + i * 20,
    is_active: false,
    priority: (i % 3) + 1,
    time_since_last_scan: 0,
    recent_detection_rate_ewma: 0,
    consecutive_misses: 0,
    periodicity_phase: Math.random(),
    periodicity_confidence: 0,
    band_priority_weight: 1.0,
    tuning_cost_to_band: 1,
  }));
}

export const useSimulationStore = create<StateStore>((set, get) => ({
  simulation: {
    id: 'sim_demo_01',
    name: 'Scenario A — Mostly Fixed Emitters',
    bands: 16,
    duration_steps: 2000,
    current_step: 0,
    seed: 42,
    status: 'draft',
    policy: 'bandit',
    receiver: {
      bandwidth_k: 2,
      dwell_ms: 50,
      tuning_delay_ms: 10,
      threshold_snr: 12,
      tuned_bands: [0, 1],
      dwell_remaining_ms: 0,
    },
    spectrum_bands: generateInitialBands(16),
    emitters: [
      { id: 'em_1', simulation_id: 'sim_demo_01', behavior_class: 'fixed', band: 3, priority: 3 },
      { id: 'em_2', simulation_id: 'sim_demo_01', behavior_class: 'periodic', band: 7, period_steps: 8, priority: 2 },
      { id: 'em_3', simulation_id: 'sim_demo_01', behavior_class: 'agile', band: 12, priority: 2 },
      { id: 'em_4', simulation_id: 'sim_demo_01', behavior_class: 'intermittent', band: 14, priority: 1 },
    ],
    metrics_baseline: { ...initialMetrics, pd: 0.42, pfa: 0.08, ait: 14.2, scan_efficiency: 0.38, cumulative_reward: 120 },
    metrics_ml: { ...initialMetrics, pd: 0.89, pfa: 0.03, ait: 3.8, scan_efficiency: 0.82, cumulative_reward: 485 },
    history: [],
  },
  selectedBand: null,
  waterfallHistory: [],
  wsConnected: true,
  wsLog: ['[WS] Connected to /ws/v1/simulations/sim_demo_01', '[WS] Subscribed to spectrum, scheduler, metrics channels'],

  setPolicy: (policy) => set((state) => ({
    simulation: { ...state.simulation, policy }
  })),

  setBandwidthK: (bandwidth_k) => set((state) => ({
    simulation: {
      ...state.simulation,
      receiver: { ...state.simulation.receiver, bandwidth_k }
    }
  })),

  setSelectedBand: (selectedBand) => set({ selectedBand }),

  startSimulation: () => set((state) => ({
    simulation: { ...state.simulation, status: 'running' }
  })),

  stopSimulation: () => set((state) => ({
    simulation: { ...state.simulation, status: 'paused' }
  })),

  resetSimulation: () => set((state) => {
    const bands = generateInitialBands(state.simulation.bands);
    return {
      simulation: {
        ...state.simulation,
        current_step: 0,
        status: 'draft',
        spectrum_bands: bands,
        history: [],
        metrics_ml: { ...initialMetrics },
      },
      waterfallHistory: [],
    };
  }),

  stepSimulation: () => {
    const state = get();
    const sim = state.simulation;
    const nextStep = sim.current_step + 1;
    const K = sim.receiver.bandwidth_k;

    // Simulate step ground truth for emitters
    const newBands = sim.spectrum_bands.map((b) => {
      let active = false;
      let emitterType: BehaviorClass | undefined = undefined;

      sim.emitters.forEach((em) => {
        if (em.behavior_class === 'fixed' && em.band === b.band_id) {
          active = true;
          emitterType = 'fixed';
        } else if (em.behavior_class === 'periodic' && em.band === b.band_id) {
          const period = em.period_steps || 8;
          if (nextStep % period < 3) {
            active = true;
            emitterType = 'periodic';
          }
        } else if (em.behavior_class === 'agile') {
          const activeBand = (Math.floor(nextStep / 5) * 3 + em.band) % sim.bands;
          if (activeBand === b.band_id) {
            active = true;
            emitterType = 'agile';
          }
        } else if (em.behavior_class === 'intermittent' && em.band === b.band_id) {
          if (Math.sin(nextStep * 0.2) > 0.4) {
            active = true;
            emitterType = 'intermittent';
          }
        }
      });

      return {
        ...b,
        is_active: active,
        emitter_type: emitterType,
        time_since_last_scan: sim.receiver.tuned_bands.includes(b.band_id) ? 0 : b.time_since_last_scan + 1,
      };
    });

    // Select tuned bands based on policy
    let tunedBands: number[] = [];
    if (sim.policy === 'baseline') {
      // Round-robin
      for (let k = 0; k < K; k++) {
        tunedBands.push((nextStep * K + k) % sim.bands);
      }
    } else {
      // ML Contextual Bandit: pick highest priority/active estimate
      const sorted = [...newBands].sort((a, b) => {
        const scoreA = (a.is_active ? 2 : 0) + a.priority + (a.time_since_last_scan * 0.1);
        const scoreB = (b.is_active ? 2 : 0) + b.priority + (b.time_since_last_scan * 0.1);
        return scoreB - scoreA;
      });
      tunedBands = sorted.slice(0, K).map(b => b.band_id);
    }

    // Calculate detection outcomes
    let tp = sim.metrics_ml.tp_count;
    let fp = sim.metrics_ml.fp_count;
    let fn = sim.metrics_ml.fn_count;
    let useful = sim.metrics_ml.useful_scans;

    tunedBands.forEach((bandId) => {
      const b = newBands[bandId];
      if (b.is_active) {
        tp += 1;
        useful += 1;
      } else {
        if (Math.random() < 0.05) fp += 1; // 5% noise false alarm
      }
    });

    newBands.forEach((b) => {
      if (b.is_active && !tunedBands.includes(b.band_id)) {
        fn += 1;
      }
    });

    const totalScans = (sim.metrics_ml.total_scans || 0) + K;
    const pd = tp / Math.max(1, tp + fn);
    const pfa = fp / Math.max(1, fp + 100);
    const scanEff = useful / Math.max(1, totalScans);
    const reward = useful * 10 - (tunedBands.length - useful) * 2;

    const newMetric: MetricsSummary = {
      ...sim.metrics_ml,
      pd: Number(pd.toFixed(3)),
      pfa: Number(pfa.toFixed(3)),
      ait: Number((15 - pd * 10).toFixed(1)),
      scan_efficiency: Number(scanEff.toFixed(3)),
      cumulative_reward: sim.metrics_ml.cumulative_reward + reward,
      tp_count: tp,
      fp_count: fp,
      fn_count: fn,
      total_scans: totalScans,
      useful_scans: useful,
    };

    const newEntry: DecisionLogEntry = {
      step: nextStep,
      scanned_bands: tunedBands,
      policy_used: sim.policy,
      reward,
      detection_type: tunedBands.some(b => newBands[b].is_active) ? 'TP' : 'TN',
      target_band_active: tunedBands.some(b => newBands[b].is_active),
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
    };

    // Update waterfall
    const activeRow = newBands.map(b => b.is_active);
    const updatedWaterfall = [activeRow, ...state.waterfallHistory].slice(0, 30);

    set({
      simulation: {
        ...sim,
        current_step: nextStep,
        spectrum_bands: newBands,
        receiver: { ...sim.receiver, tuned_bands: tunedBands },
        metrics_ml: newMetric,
        history: [newEntry, ...sim.history].slice(0, 50),
      },
      waterfallHistory: updatedWaterfall,
    });
  },

  loadScenario: (scenarioId) => {
    let bands = 16;
    let duration = 2000;
    let emittersCount = 10;
    let name = `Scenario ${scenarioId}`;

    if (scenarioId === 'A') { name = 'Scenario A — 80% Fixed (16 Bands)'; bands = 16; }
    if (scenarioId === 'B') { name = 'Scenario B — 70% Periodic (16 Bands)'; bands = 16; }
    if (scenarioId === 'C') { name = 'Scenario C — 70% Agile (24 Bands)'; bands = 24; }
    if (scenarioId === 'D') { name = 'Scenario D — Mixed Environment (24 Bands)'; bands = 24; }
    if (scenarioId === 'E') { name = 'Scenario E — High Density (32 Bands)'; bands = 32; emittersCount = 20; }
    if (scenarioId === 'F') { name = 'Scenario F — Sparse Spectrum (32 Bands)'; bands = 32; emittersCount = 5; }
    if (scenarioId === 'G') { name = 'Scenario G — Rapidly Changing (24 Bands)'; bands = 24; }

    const newBands = generateInitialBands(bands);
    const emitters: EmitterConfig[] = Array.from({ length: emittersCount }, (_, i) => ({
      id: `em_${i}`,
      simulation_id: `sim_${scenarioId}`,
      behavior_class: (i % 2 === 0 ? 'periodic' : 'agile') as BehaviorClass,
      band: (i * 2) % bands,
      period_steps: 6 + (i % 4) * 2,
      priority: (i % 3) + 1,
    }));

    set({
      simulation: {
        id: `sim_${scenarioId}`,
        name,
        bands,
        duration_steps: duration,
        current_step: 0,
        seed: 42,
        status: 'draft',
        policy: 'bandit',
        receiver: {
          bandwidth_k: 2,
          dwell_ms: 50,
          tuning_delay_ms: 10,
          threshold_snr: 12,
          tuned_bands: [0, 1],
          dwell_remaining_ms: 0,
        },
        spectrum_bands: newBands,
        emitters,
        metrics_baseline: { ...initialMetrics, pd: 0.38, pfa: 0.09, ait: 16.5, scan_efficiency: 0.35, cumulative_reward: 110 },
        metrics_ml: { ...initialMetrics, pd: 0.88, pfa: 0.02, ait: 4.1, scan_efficiency: 0.84, cumulative_reward: 510 },
        history: [],
      },
      waterfallHistory: [],
    });
  },

  addEmitter: (behavior_class, band, priority) => set((state) => {
    const newEmitter: EmitterConfig = {
      id: `em_${Date.now()}`,
      simulation_id: state.simulation.id,
      behavior_class,
      band,
      priority,
    };
    return {
      simulation: {
        ...state.simulation,
        emitters: [...state.simulation.emitters, newEmitter],
      }
    };
  })
}));
