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
    }
  },
  experiments: {
    create: async (data: any) => {
      const newExp = { id: uuid('exp'), ...data, status: 'completed' as const };
      experiments.push(newExp);
      return { success: true, data: newExp, requestId: uuid('req') };
    },
    list: async () => {
      return { success: true, data: experiments, requestId: uuid('req') };
    },
    get: async (id: string) => {
      const found = experiments.find(e => e.id === id);
      return { success: true, data: found, requestId: uuid('req') };
    },
    run: async (_id: string) => {
      return { success: true, data: {}, requestId: uuid('req') };
    },
    stop: async (_id: string) => {
      return { success: true, data: {}, requestId: uuid('req') };
    },
    getResults: async (id: string) => {
      const exp = experiments.find(e => e.id === id);
      const results: Record<string, any> = {};
      exp?.policies.forEach(p => {
        results[p] = { pd: 0.75 + Math.random() * 0.2, pfa: Math.random() * 0.05, latency: 5 + Math.random() * 10 };
      });
      return { success: true, data: { experiment_id: id, results }, requestId: uuid('req') };
    }
  },
  metrics: {
    getLive: async (simulationId: string) => {
      return {
        success: true,
        data: { simulation_id: simulationId, step: 450, reward: 8.75, pd: 0.86, pfa: 0.03, latency: 8.2, ait: 2.1, scan_efficiency: 0.75 },
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

    // Spectrum update
    const numBands = store.getState().activeSimulation?.bands || 16;
    const occupancy: Record<number, boolean> = {};
    for (let i = 0; i < numBands; i++) {
      occupancy[i] = Math.random() > 0.75;
    }
    const tuned = [Math.floor(Math.random() * numBands)];
    
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

    // Decision update every 3 steps
    if (step % 3 === 0) {
      const isSignalPresent = occupancy[tuned[0]];
      const stepReward = isSignalPresent ? Number((7.8 + Math.random() * 3.4).toFixed(2)) : Number((1.2 + Math.random() * 1.8).toFixed(2));
      const decision = {
        action: { next_band: tuned[0], dwell_time: 10 },
        model_id: 'model_bandit_9f8e7d',
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

      // Maybe detection event
      if (occupancy[tuned[0]]) {
        const detEnv = {
          type: 'detection_event',
          data: { simulation_id: simulationId, step, band_id: tuned[0], detection_type: 'TP', latency_ms: Math.random() * 20 }
        };

        if (store.getState().wsClient) {
          store.getState().wsClient.logRawMessage(JSON.stringify(detEnv));
        }

        store.setState((prev: any) => ({
          detections: [detEnv.data, ...prev.detections].slice(0, 50)
        }));
      }
    }

    // Metrics update every 10 steps
    if (step % 10 === 0) {
      const isHit = occupancy[tuned[0]];
      const liveReward = isHit ? Number((8.2 + Math.random() * 2.8).toFixed(2)) : Number((2.0 + Math.random() * 2.0).toFixed(2));
      const metrics = {
        simulation_id: simulationId,
        step,
        reward: liveReward,
        pd: 0.8 + Math.random() * 0.15,
        pfa: Math.random() * 0.05,
        latency: 4 + Math.random() * 8,
        ait: 1.5 + Math.random() * 2.0,
        scan_efficiency: 0.6 + Math.random() * 0.3
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
  }, 1000);
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
