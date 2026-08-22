import type { StandardEnvelope, Simulation, Emitter, ModelMetadata, Experiment, ExperimentResults, LiveMetrics, PolicyType } from '../../types';
import { mockApi } from './mock';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Setup global mock mode tracker
(window as any).__mockMode__ = true; // Default to true so test harness is immediately fully interactive!

async function request<T>(path: string, options?: RequestInit): Promise<StandardEnvelope<T>> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    return data as StandardEnvelope<T>;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network connection failed',
      },
      requestId: `err_${Math.random().toString(36).substring(2, 6)}`,
    };
  }
}

export const api = {
  simulations: {
    create: (data: { name: string; bands: number; duration_steps: number; seed: number }): Promise<StandardEnvelope<{ id: string; status: 'draft' | 'running' | 'paused' | 'completed' }>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.create(data) as any)
        : request<{ id: string; status: 'draft' | 'running' | 'paused' | 'completed' }>('/simulations', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
    list: (status?: string): Promise<StandardEnvelope<Simulation[]>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.list() as any)
        : request<Simulation[]>(`/simulations${status ? `?status=${status}` : ''}`),
    get: (id: string): Promise<StandardEnvelope<Simulation & { emitters: Emitter[] }>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.get(id) as any)
        : request<Simulation & { emitters: Emitter[] }>(`/simulations/${id}`),
    update: (id: string, data: any): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.update(id, data) as any)
        : request<any>(`/simulations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
    delete: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.delete(id) as any)
        : request<any>(`/simulations/${id}`, {
            method: 'DELETE',
          }),
    start: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.start(id) as any)
        : request<any>(`/simulations/${id}/start`, {
            method: 'POST',
          }),
    stop: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.stop(id) as any)
        : request<any>(`/simulations/${id}/stop`, {
            method: 'POST',
          }),
    reset: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.simulations.reset(id) as any)
        : request<any>(`/simulations/${id}/reset`, {
            method: 'POST',
          }),
  },
  emitters: {
    create: (data: { behavior_class: string; band: number; period?: number; priority?: number; simulation_id: string }): Promise<StandardEnvelope<Emitter>> =>
      (window as any).__mockMode__
        ? (mockApi.emitters.create(data) as any)
        : request<Emitter>('/emitters', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
    get: (id: string): Promise<StandardEnvelope<Emitter>> =>
      (window as any).__mockMode__
        ? (mockApi.emitters.get(id) as any)
        : request<Emitter>(`/emitters/${id}`),
    update: (id: string, data: any): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.emitters.update(id, data) as any)
        : request<any>(`/emitters/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
    delete: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.emitters.delete(id) as any)
        : request<any>(`/emitters/${id}`, {
            method: 'DELETE',
          }),
  },
  receiver: {
    getStatus: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.receiver.getStatus() as any)
        : request<any>('/receiver/status'),
    updateConfig: (data: { bandwidth_k: number; dwell_ms: number; tuning_delay: number; threshold: number }): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.receiver.updateConfig(data) as any)
        : request<any>('/receiver/config', {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
    scan: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.receiver.scan() as any)
        : request<any>('/receiver/scan', {
            method: 'POST',
          }),
  },
  scheduler: {
    getStatus: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.getStatus() as any)
        : request<any>('/scheduler/status'),
    updateConfig: (policy: PolicyType): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.updateConfig(policy) as any)
        : request<any>('/scheduler/config', {
            method: 'PUT',
            body: JSON.stringify({ policy }),
          }),
    start: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.start() as any)
        : request<any>('/scheduler/start', {
            method: 'POST',
          }),
    stop: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.stop() as any)
        : request<any>(`/scheduler/stop`, {
            method: 'POST',
          }),
    getDecision: (): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.getDecision() as any)
        : request<any>('/scheduler/decision'),
    getHistory: (page = 0, size = 20): Promise<StandardEnvelope<any[]>> =>
      (window as any).__mockMode__
        ? (mockApi.scheduler.getHistory() as any)
        : request<any[]>(`/scheduler/history?page=${page}&size=${size}`),
  },
  models: {
    train: (data: { algorithm: string; scenario: string; hyperparams?: any; episode_count?: number; seed_range?: [number, number] }): Promise<StandardEnvelope<{ job_id: string }>> =>
      (window as any).__mockMode__
        ? (mockApi.models.train(data) as any)
        : request<{ job_id: string }>('/models/train', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
    list: (algorithm?: string, active?: boolean): Promise<StandardEnvelope<ModelMetadata[]>> => {
      if ((window as any).__mockMode__) return mockApi.models.list() as any;
      const params = new URLSearchParams();
      if (algorithm) params.append('algorithm', algorithm);
      if (active !== undefined) params.append('active', String(active));
      return request<ModelMetadata[]>(`/models?${params.toString()}`);
    },
    get: (id: string): Promise<StandardEnvelope<ModelMetadata>> =>
      (window as any).__mockMode__
        ? (mockApi.models.get(id) as any)
        : request<ModelMetadata>(`/models/${id}`),
    activate: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.models.activate(id) as any)
        : request<any>(`/models/${id}/activate`, {
            method: 'POST',
          }),
    evaluate: (id: string, data: { scenario: string; episode_count: number }): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.models.evaluate(id, data) as any)
        : request<any>(`/models/${id}/evaluate`, {
            method: 'POST',
            body: JSON.stringify(data),
          }),
  },
  experiments: {
    create: (data: { scenario: string; policies: string[] }): Promise<StandardEnvelope<Experiment>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.create(data) as any)
        : request<Experiment>('/experiments', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
    list: (): Promise<StandardEnvelope<Experiment[]>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.list() as any)
        : request<Experiment[]>('/experiments'),
    get: (id: string): Promise<StandardEnvelope<Experiment>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.get(id) as any)
        : request<Experiment>(`/experiments/${id}`),
    run: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.run(id) as any)
        : request<any>(`/experiments/${id}/run`, {
            method: 'POST',
          }),
    stop: (id: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.stop(id) as any)
        : request<any>(`/experiments/${id}/stop`, {
            method: 'POST',
          }),
    getResults: (id: string): Promise<StandardEnvelope<ExperimentResults>> =>
      (window as any).__mockMode__
        ? (mockApi.experiments.getResults(id) as any)
        : request<ExperimentResults>(`/experiments/${id}/results`),
  },
  metrics: {
    getLive: (simulationId: string): Promise<StandardEnvelope<LiveMetrics>> =>
      (window as any).__mockMode__
        ? (mockApi.metrics.getLive(simulationId) as any)
        : request<LiveMetrics>(`/metrics/live?simulationId=${simulationId}`),
    getExperiment: (experimentId: string): Promise<StandardEnvelope<any>> =>
      (window as any).__mockMode__
        ? (mockApi.metrics.getExperiment(experimentId) as any)
        : request<any>(`/metrics/${experimentId}`),
    compare: (ids: string[]): Promise<StandardEnvelope<any>> => {
      if ((window as any).__mockMode__) return mockApi.metrics.compare(ids) as any;
      const query = ids.map(id => `ids[]=${encodeURIComponent(id)}`).join('&');
      return request<any>(`/metrics/compare?${query}`);
    },
  },
};
