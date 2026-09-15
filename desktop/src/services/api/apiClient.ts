import type {
  StandardEnvelope,
  Simulation,
  Emitter,
  ReceiverConfig,
  ReceiverStatus,
  SchedulerStatus,
  SchedulerDecision,
  DecisionLogEntry,
  ModelMetadata,
  Experiment,
  ExperimentResults,
  LiveMetrics,
  AuditEvent,
  PolicyType,
} from '../../types';
import { ENDPOINTS } from './endpoints';
import { authManager } from './authInterceptor';

const BASE_URL = 'http://127.0.0.1:8080/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<StandardEnvelope<T>> {
  const url = `${BASE_URL}${path}`;
  const token = authManager.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    return json as StandardEnvelope<T>;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Local backend connection error at 127.0.0.1:8080',
      },
      requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
    };
  }
}

export const apiClient = {
  auth: {
    login: (username: string, password: string): Promise<StandardEnvelope<{ token: string; mfaRequired: boolean; user: any }>> =>
      request(ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    verifyMfa: (code: string): Promise<StandardEnvelope<{ token: string; user: any }>> =>
      request(ENDPOINTS.MFA_VERIFY, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    logout: (): Promise<StandardEnvelope<{ message: string }>> =>
      request(ENDPOINTS.LOGOUT, { method: 'POST' }),
    getSession: (): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SESSION),
  },

  simulations: {
    create: (data: { name: string; bands: number; duration_steps: number; seed: number; scenario?: string }): Promise<StandardEnvelope<{ id: string; status: string }>> =>
      request(ENDPOINTS.SIMULATIONS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (status?: string): Promise<StandardEnvelope<Simulation[]>> =>
      request(`${ENDPOINTS.SIMULATIONS}${status ? `?status=${status}` : ''}`),
    get: (id: string): Promise<StandardEnvelope<Simulation & { emitters: Emitter[] }>> =>
      request(ENDPOINTS.SIMULATION_BY_ID(id)),
    start: (id: string, policy?: string): Promise<StandardEnvelope<any>> =>
      request(`${ENDPOINTS.SIMULATION_START(id)}${policy ? `?policy=${encodeURIComponent(policy)}` : ''}`, {
        method: 'POST',
      }),
    stop: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SIMULATION_STOP(id), { method: 'POST' }),
    reset: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SIMULATION_RESET(id), { method: 'POST' }),
    getMetrics: (id: string): Promise<StandardEnvelope<LiveMetrics>> =>
      request(ENDPOINTS.SIMULATION_METRICS(id)),
    getMetricsSummary: (id: string): Promise<StandardEnvelope<LiveMetrics>> =>
      request(ENDPOINTS.SIMULATION_METRICS_SUMMARY(id)),
  },

  emitters: {
    create: (data: { behavior_class: string; band: number; period?: number; priority?: number; simulation_id: string }): Promise<StandardEnvelope<Emitter>> =>
      request(ENDPOINTS.EMITTERS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (simulationId?: string): Promise<StandardEnvelope<Emitter[]>> =>
      request(`${ENDPOINTS.EMITTERS}${simulationId ? `?simulation_id=${simulationId}` : ''}`),
    get: (id: string): Promise<StandardEnvelope<Emitter>> =>
      request(ENDPOINTS.EMITTER_BY_ID(id)),
    delete: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.EMITTER_BY_ID(id), { method: 'DELETE' }),
  },

  receiver: {
    getStatus: (simulationId?: string): Promise<StandardEnvelope<ReceiverStatus>> =>
      request(simulationId ? `${ENDPOINTS.RECEIVER_STATUS}?simulationId=${simulationId}` : ENDPOINTS.RECEIVER_STATUS),
    updateConfig: (data: Partial<ReceiverConfig> & { simulation_id?: string }): Promise<StandardEnvelope<ReceiverConfig>> =>
      request(ENDPOINTS.RECEIVER_CONFIG, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  scheduler: {
    getStatus: (): Promise<StandardEnvelope<SchedulerStatus>> =>
      request(ENDPOINTS.SCHEDULER_STATUS),
    setPolicy: (policy: PolicyType): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SCHEDULER_POLICY, {
        method: 'PUT',
        body: JSON.stringify({ policy }),
      }),
    step: (simulationId: string): Promise<StandardEnvelope<SchedulerDecision>> =>
      request(ENDPOINTS.SCHEDULER_STEP, {
        method: 'POST',
        body: JSON.stringify({ simulation_id: simulationId }),
      }),
    getDecisions: (limit: number = 20): Promise<StandardEnvelope<DecisionLogEntry[]>> =>
      request(`${ENDPOINTS.SCHEDULER_DECISIONS}?limit=${limit}`),
  },

  experiments: {
    create: (data: { name?: string; scenario?: string; policies?: PolicyType[]; simulation_id?: string; repetitions?: number; seed?: number }): Promise<StandardEnvelope<Experiment>> =>
      request(ENDPOINTS.EXPERIMENTS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (): Promise<StandardEnvelope<Experiment[]>> =>
      request(ENDPOINTS.EXPERIMENTS),
    get: (id: string): Promise<StandardEnvelope<Experiment>> =>
      request(ENDPOINTS.EXPERIMENT_BY_ID(id)),
    run: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.EXPERIMENT_RUN(id), { method: 'POST' }),
    getComparison: (id: string): Promise<StandardEnvelope<ExperimentResults>> =>
      request(ENDPOINTS.EXPERIMENT_COMPARISON(id)),
  },

  models: {
    list: (): Promise<StandardEnvelope<ModelMetadata[]>> =>
      request(ENDPOINTS.MODELS),
    train: (data: { algorithm: PolicyType; hyperparams: Record<string, any>; scenario?: string }): Promise<StandardEnvelope<{ job_id: string }>> =>
      request(ENDPOINTS.MODEL_TRAIN, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string): Promise<StandardEnvelope<ModelMetadata>> =>
      request(ENDPOINTS.MODEL_BY_ID(id)),
    evaluate: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.MODEL_EVALUATE(id), { method: 'POST' }),
    requestActivation: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.MODEL_REQUEST_ACTIVATION(id), { method: 'POST' }),
    approve: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.MODEL_APPROVE(id), { method: 'POST' }),
    rollback: (id: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.MODEL_ROLLBACK(id), { method: 'POST' }),
  },

  reports: {
    generate: (experimentId: string, format: string = 'pdf'): Promise<StandardEnvelope<{ report_id: string; file_path: string }>> =>
      request(ENDPOINTS.REPORTS, {
        method: 'POST',
        body: JSON.stringify({ experiment_id: experimentId, format }),
      }),
    get: (reportId: string): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.REPORT_BY_ID(reportId)),
    downloadUrl: (reportId: string) => `${BASE_URL}${ENDPOINTS.REPORT_DOWNLOAD(reportId)}`,
  },

  audit: {
    getAuditLog: (limit: number = 50): Promise<StandardEnvelope<AuditEvent[]>> =>
      request(`${ENDPOINTS.AUDIT_LOG}?limit=${limit}`),
    getSecurityConfig: (): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SECURITY_CONFIG),
    updateSecurityConfig: (config: any): Promise<StandardEnvelope<any>> =>
      request(ENDPOINTS.SECURITY_CONFIG, {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
  },
};
