import type { Simulation, Emitter, ModelMetadata, Experiment, PolicyType } from '../../types';

// Helper to generate UUIDs
const uuid = (prefix: string) => `${prefix}_${Math.random().toString(16).substring(2, 10)}`;

// Mock database in memory
let simulations: Simulation[] = [
  { id: 'sim_a1b2c3d4', name: 'Baseline Static Mix', bands: 16, duration_steps: 2000, seed: 42, status: 'draft' },
  { id: 'sim_e5f6g7h8', name: 'Periodic Burst Test', bands: 16, duration_steps: 2000, seed: 101, status: 'running' },
];

let emitters: Record<string, Emitter[]> = {
  'sim_a1b2c3d4': [
    { id: 'emit_1', simulation_id: 'sim_a1b2c3d4', behavior_class: 'fixed', band: 3, priority: 1.0 },
    { id: 'emit_2', simulation_id: 'sim_a1b2c3d4', behavior_class: 'random', band: 8, priority: 1.0 },
  ],
  'sim_e5f6g7h8': [
    { id: 'emit_3', simulation_id: 'sim_e5f6g7h8', behavior_class: 'periodic', band: 5, period: 8, priority: 2.0 },
  ]
};

let receiverConfig = {
  bandwidth_k: 2,
  dwell_ms: 10,
  tuning_delay: 5,
  threshold: 15.0
};

let schedulerStatus: { policy: PolicyType; step_count: number; running: boolean } = {
  policy: 'baseline',
  step_count: 342,
  running: false
};

let models: ModelMetadata[] = [
  { id: 'model_bandit_9f8e7d', algorithm: 'bandit', version: '1.0.0', active: true, hyperparams: {}, created_at: new Date().toISOString() },
  { id: 'model_q_learning_a1b2', algorithm: 'q_learning', version: '1.2.0', active: false, hyperparams: {}, created_at: new Date().toISOString() }
];

let experiments: Experiment[] = [
  { id: 'exp_ab12cd34', scenario: 'A', policies: ['baseline', 'bandit'], status: 'completed' }
];

// Mock WebSocket simulation run interval registry
const wsSimulationIntervals: Record<string, any> = {};

export const mockApi = {
  simulations: {
    create: async (data: any) => {
      const newSim = { id: uuid('sim'), ...data, status: 'draft' };
      simulations.push(newSim);
      emitters[newSim.id] = [];
      return { success: true, data: { id: newSim.id, status: 'draft' }, requestId: uuid('req') };
    },
    list: async () => {
      return { success: true, data: simulations, requestId: uuid('req') };
    },
    get: async (id: string) => {
      const sim = simulations.find(s => s.id === id);
      if (!sim) return { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Sim not found' }, requestId: uuid('req') };
      return { success: true, data: { ...sim, emitters: emitters[id] || [] }, requestId: uuid('req') };
    },
    update: async (id: string, data: any) => {
      simulations = simulations.map(s => s.id === id ? { ...s, ...data } : s);
      return { success: true, data: {}, requestId: uuid('req') };
    },
    delete: async (id: string) => {
      simulations = simulations.filter(s => s.id !== id);
      delete emitters[id];
      return { success: true, data: {}, requestId: uuid('req') };
    },
    start: async (id: string) => {
      const sim = simulations.find(s => s.id === id);
      if (sim) {
        sim.status = 'running';
        // Start simulated WebSocket messages for this simulation
        startMockWSUpdates(id);
      }
      return { success: true, data: {}, requestId: uuid('req') };
    },
    stop: async (id: string) => {
      const sim = simulations.find(s => s.id === id);
      if (sim) {
        sim.status = 'paused';
        stopMockWSUpdates(id);
      }
      return { success: true, data: {}, requestId: uuid('req') };
    },
    reset: async (id: string) => {
      const sim = simulations.find(s => s.id === id);
      if (sim) {
        sim.status = 'draft';
        stopMockWSUpdates(id);
      }
      return { success: true, data: {}, requestId: uuid('req') };
    }
  },
  emitters: {
    create: async (data: any) => {
      const newEmit = { id: uuid('emit'), ...data };
      if (!emitters[data.simulation_id]) emitters[data.simulation_id] = [];
      emitters[data.simulation_id].push(newEmit);
      return { success: true, data: newEmit, requestId: uuid('req') };
    },
    list: async (simulationId?: string) => {
      if (simulationId && emitters[simulationId]) {
        return { success: true, data: emitters[simulationId], requestId: uuid('req') };
      }
      const all = Object.values(emitters).flat();
      return { success: true, data: all, requestId: uuid('req') };
    },
    get: async (id: string) => {
      for (const simId in emitters) {
        const found = emitters[simId].find(e => e.id === id);
        if (found) return { success: true, data: found, requestId: uuid('req') };
      }
      return { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Emitter not found' }, requestId: uuid('req') };
    },
    update: async (_id: string, _data: any) => {
      return { success: true, data: {}, requestId: uuid('req') };
    },
    delete: async (id: string) => {
      for (const simId in emitters) {
        emitters[simId] = emitters[simId].filter(e => e.id !== id);
      }
      return { success: true, data: {}, requestId: uuid('req') };
    }
  },
  receiver: {
    getStatus: async () => {
      return { success: true, data: { tuned_bands: [2], dwell_remaining: 10, ...receiverConfig }, requestId: uuid('req') };
    },
    updateConfig: async (data: any) => {
      receiverConfig = { ...receiverConfig, ...data };
      return { success: true, data: {}, requestId: uuid('req') };
    },
    scan: async () => {
      return {
        success: true,
        data: {
          timestamp: Date.now(),
          observation: [
            { band_id: 2, snr: 18.4, signal_present: true },
            { band_id: 3, snr: 3.1, signal_present: false }
          ]
        },
        requestId: uuid('req')
      };
    }
  },
  scheduler: {
    getStatus: async () => {
      return { success: true, data: schedulerStatus, requestId: uuid('req') };
    },
    updateConfig: async (policy: PolicyType) => {
      schedulerStatus.policy = policy;
      return { success: true, data: {}, requestId: uuid('req') };
    },
    start: async () => {
      schedulerStatus.running = true;
      return { success: true, data: {}, requestId: uuid('req') };
    },
    stop: async () => {
      schedulerStatus.running = false;
      return { success: true, data: {}, requestId: uuid('req') };
    },
    getDecision: async () => {
      return {
        success: true,
        data: {
          action: { next_band: Math.floor(Math.random() * 16), dwell_time: 10 },
          model_id: 'model_bandit_9f8e7d',
          decision_id: uuid('dec')
        },
        requestId: uuid('req')
      };
    },
    getHistory: async () => {
      return {
        success: true,
        data: [
          { decision_id: uuid('dec'), action: { next_band: 1, dwell_time: 10 }, model_id: 'model_bandit_9f8e7d' },
          { decision_id: uuid('dec'), action: { next_band: 5, dwell_time: 10 }, model_id: 'model_bandit_9f8e7d' }
        ],
        requestId: uuid('req')
      };
    }
  },
  models: {
    train: async (data: any) => {
      const jobId = uuid('job');
      // Simulate training progress over WS
      simulateWSProgress(jobId);
      const newModel = { id: uuid('model_' + data.algorithm), algorithm: data.algorithm, version: '1.0.0', active: false, hyperparams: {}, created_at: new Date().toISOString() };
      models.push(newModel);
      return { success: true, data: { job_id: jobId }, requestId: uuid('req') };
    },
    list: async () => {
      return { success: true, data: models, requestId: uuid('req') };
    },
    get: async (id: string) => {
      const found = models.find(m => m.id === id);
      return { success: true, data: found, requestId: uuid('req') };
    },
    activate: async (id: string) => {
      models = models.map(m => m.id === id ? { ...m, active: true } : { ...m, active: false });
      return { success: true, data: {}, requestId: uuid('req') };
    },
    evaluate: async (_id: string, _data: any) => {
      return {
        success: true,
        data: { pd: 0.88, pfa: 0.02, ait: 3.4, latency: 12.5, hpdr: 0.91 },
        requestId: uuid('req')
      };
    },
    getMetadata: async (id: string) => {
      const model = models.find(m => m.id === id) || models[0];
      return { success: true, data: model, requestId: uuid('req') };
    }
  },
  experiments: {
    create: async (data: any) => {
      const newExp = typeof data === 'string' ? { id: uuid('exp'), name: data, status: 'draft' as const } : { id: uuid('exp'), ...data, status: 'draft' as const };
      experiments.push(newExp);
      return { success: true, data: newExp, requestId: uuid('req') };
    },
    list: async () => {
      return { success: true, data: experiments, requestId: uuid('req') };
    },
    get: async (id: string) => {
      const exp = experiments.find(e => e.id === id) || experiments[0];
      return { success: true, data: exp, requestId: uuid('req') };
    },
    run: async (id: string) => {
      const exp = experiments.find(e => e.id === id);
      if (exp) exp.status = 'running';
      return { success: true, data: { status: 'running' }, requestId: uuid('req') };
    },
    stop: async (id: string) => {
      const exp = experiments.find(e => e.id === id);
      if (exp) exp.status = 'completed';
      return { success: true, data: {}, requestId: uuid('req') };
    },
    getResults: async (id: string) => {
      return {
        success: true,
        data: {
          experiment_id: id,
          results: {
            baseline: { pd: 0.492, pfa: 0.04, latency_ms: 28.5, ait_ms: 28.5, score: 49.2 },
            bandit: { pd: 0.885, pfa: 0.02, latency_ms: 10.2, ait_ms: 10.2, score: 88.5 },
            q_learning: { pd: 0.912, pfa: 0.015, latency_ms: 7.8, ait_ms: 7.8, score: 91.2 },
            dqn: { pd: 0.941, pfa: 0.01, latency_ms: 5.9, ait_ms: 5.9, score: 94.1 }
          }
        },
        requestId: uuid('req')
      };
    }
  },
  metrics: {
    getLive: async (simulationId: string) => {
      const store = (window as any).__store__;
      const policy = store?.getState()?.activePolicy || 'baseline';
      const isBaseline = policy === 'baseline';

      return {
        success: true,
        data: {
          simulation_id: simulationId,
          step: store?.getState()?.liveMetrics?.step ?? 342,
          reward: isBaseline ? 3.2 : 9.4,
          pd: isBaseline ? 0.492 : (policy === 'bandit' ? 0.885 : policy === 'q_learning' ? 0.912 : 0.941),
          pfa: isBaseline ? 0.048 : 0.012,
          latency: isBaseline ? 28.5 : (policy === 'bandit' ? 10.2 : policy === 'q_learning' ? 7.8 : 5.9),
          ait: isBaseline ? 28.5 : (policy === 'bandit' ? 10.2 : policy === 'q_learning' ? 7.8 : 5.9),
          scan_efficiency: isBaseline ? 0.22 : (policy === 'bandit' ? 0.68 : policy === 'q_learning' ? 0.74 : 0.82)
        },
        requestId: uuid('req')
      };
    },
    getExperiment: async (experimentId: string) => {
      return {
        success: true,
        data: { experiment_id: experimentId, pd: 0.88, pfa: 0.02, latency: 7.1 },
        requestId: uuid('req')
      };
    },
    compare: async (ids: string[]) => {
      return {
        success: true,
        data: ids.map(id => ({ experiment_id: id, pd: 0.8 + Math.random() * 0.15, pfa: Math.random() * 0.04 })),
        requestId: uuid('req')
      };
    },
    getFinal: async (simulationId: string) => {
      return {
        success: true,
        data: {
          simulation_id: simulationId,
          total_steps: 2000,
          reward_mean: 8.8,
          pd: 0.92,
          pfa: 0.01,
          avg_intercept_time_ms: 6.8,
          high_priority_detection_rate: 0.96
        },
        requestId: uuid('req')
      };
    }
  }
};

// Dispatch helpers to send mock WS updates to the app store
function startMockWSUpdates(simulationId: string) {
  if (wsSimulationIntervals[simulationId]) return;

  let step = 0;
  wsSimulationIntervals[simulationId] = setInterval(() => {
    step++;
    const store = (window as any).__store__;
    if (!store || store.getState().activeSimulationId !== simulationId) {
      clearInterval(wsSimulationIntervals[simulationId]);
      delete wsSimulationIntervals[simulationId];
      return;
    }

    const state = store.getState();
    const numBands = state.activeSimulation?.bands || 16;
    const activePolicy = state.activePolicy || 'baseline';
    const emitters = state.emitters || [];

    // Real occupancy based on emitter behaviors
    const occupancy: Record<number, boolean> = {};
    for (let i = 0; i < numBands; i++) {
      const emitter = emitters.find((e: any) => e.band === i);
      if (emitter) {
        if (emitter.behavior_class === 'fixed') {
          occupancy[i] = true;
        } else if (emitter.behavior_class === 'periodic') {
          const period = Math.max(2, emitter.period || 4);
          occupancy[i] = (step % period) === 0;
        } else if (emitter.behavior_class === 'agile') {
          occupancy[i] = (step % 3) === (i % 3);
        } else {
          occupancy[i] = Math.random() > 0.6;
        }
      } else {
        occupancy[i] = false;
      }
    }

    // Next tuned band according strictly to policy
    let nextBand = 0;
    if (activePolicy === 'baseline') {
      // BASELINE: Strict Round-Robin sequential scan (0 -> 1 -> 2 -> ... -> numBands-1 -> 0)
      nextBand = step % numBands;
    } else if (activePolicy === 'bandit') {
      // BANDIT: Exploits known active channels + explores
      if (Math.random() < 0.15 || emitters.length === 0) {
        nextBand = (step * 3 + 1) % numBands;
      } else {
        const emitterBands = emitters.map((e: any) => e.band ?? 0);
        nextBand = emitterBands[step % emitterBands.length];
      }
    } else if (activePolicy === 'q_learning') {
      // Q-LEARNING: Tracks periodic/priority channels
      const periodic = emitters.filter((e: any) => e.behavior_class === 'periodic' || (e.priority ?? 1) >= 2);
      const candidates = periodic.length > 0 ? periodic.map((e: any) => e.band ?? 0) : emitters.map((e: any) => e.band ?? 0);
      nextBand = candidates.length > 0 && Math.random() > 0.10
        ? candidates[step % candidates.length]
        : (step * 2) % numBands;
    } else {
      // DQN / PPO: Deep Q-learning targeting agile and top priority threats
      const sorted = [...emitters].sort((a: any, b: any) => (b.priority ?? 1) - (a.priority ?? 1));
      const topBands = sorted.slice(0, 3).map((e: any) => e.band ?? 0);
      nextBand = topBands.length > 0 && Math.random() > 0.05
        ? topBands[step % topBands.length]
        : (step % numBands);
    }

    const tuned = [nextBand];
    
    const specEnv = {
      type: 'spectrum_update',
      data: { simulation_id: simulationId, timestamp: Date.now(), step, band_occupancy: occupancy, tuned_bands: tuned }
    };
    
    // Dispatch
    if (store.getState().wsClient) {
      store.getState().wsClient.logRawMessage(JSON.stringify(specEnv));
    }
    
    store.setState({
      bandOccupancy: occupancy,
      tunedBands: tuned,
    });

    // Decision update every step
    const isSignalPresent = occupancy[tuned[0]];
    const stepReward = isSignalPresent 
      ? Number((7.8 + Math.random() * 3.4).toFixed(2)) 
      : Number((activePolicy === 'baseline' ? 0.8 : 1.5).toFixed(2));

    const decision = {
      action: { next_band: tuned[0], dwell_time: 10 },
      model_id: activePolicy === 'baseline' ? 'baseline_round_robin' : `model_${activePolicy}_9f8e7d`,
      decision_id: uuid('dec'),
      reward: stepReward
    };
    
    const decEnv = {
      type: 'scan_decision',
      data: { simulation_id: simulationId, step, decision }
    };

    if (store.getState().wsClient) {
      store.getState().wsClient.logRawMessage(JSON.stringify(decEnv));
    }

    store.setState((prev: any) => ({
      latestDecision: decision,
      decisionHistory: [decision, ...prev.decisionHistory].slice(0, 50)
    }));

    // Detection event if tuned on active emitter
    if (occupancy[tuned[0]]) {
      const detEnv = {
        type: 'detection_event',
        data: { simulation_id: simulationId, step, band_id: tuned[0], detection_type: 'TP', latency_ms: Math.random() * 12 }
      };

      if (store.getState().wsClient) {
        store.getState().wsClient.logRawMessage(JSON.stringify(detEnv));
      }

      store.setState((prev: any) => ({
        detections: [detEnv.data, ...prev.detections].slice(0, 50)
      }));
    }

    // Metrics update every 5 steps
    if (step % 5 === 0) {
      const isBaseline = activePolicy === 'baseline';
      const liveReward = isBaseline ? 3.2 : 9.4;
      const metrics = {
        simulation_id: simulationId,
        step,
        reward: liveReward,
        pd: isBaseline ? 0.492 : (activePolicy === 'bandit' ? 0.885 : activePolicy === 'q_learning' ? 0.912 : 0.941),
        pfa: isBaseline ? 0.048 : 0.012,
        latency: isBaseline ? 28.5 : (activePolicy === 'bandit' ? 10.2 : activePolicy === 'q_learning' ? 7.8 : 5.9),
        ait: isBaseline ? 28.5 : (activePolicy === 'bandit' ? 10.2 : activePolicy === 'q_learning' ? 7.8 : 5.9),
        scan_efficiency: isBaseline ? 0.22 : (activePolicy === 'bandit' ? 0.68 : activePolicy === 'q_learning' ? 0.74 : 0.82)
      };

      const metEnv = {
        type: 'metrics_update',
        data: metrics
      };

      if (store.getState().wsClient) {
        store.getState().wsClient.logRawMessage(JSON.stringify(metEnv));
      }

      store.setState({ liveMetrics: metrics });
    }
  }, 600);
}

function stopMockWSUpdates(simulationId: string) {
  if (wsSimulationIntervals[simulationId]) {
    clearInterval(wsSimulationIntervals[simulationId]);
    delete wsSimulationIntervals[simulationId];
  }
}

function simulateWSProgress(jobId: string) {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 0.2;
    const store = (window as any).__store__;
    if (!store) {
      clearInterval(interval);
      return;
    }

    const progEnv = {
      type: 'training_progress',
      data: {
        job_id: jobId,
        status: progress >= 1.0 ? 'done' : 'running',
        progress: Math.min(progress, 1.0)
      }
    };

    if (store.getState().wsClient) {
      store.getState().wsClient.logRawMessage(JSON.stringify(progEnv));
    }

    store.setState({ trainingProgress: progEnv.data });

    if (progress >= 1.0) {
      clearInterval(interval);
    }
  }, 1500);
}
