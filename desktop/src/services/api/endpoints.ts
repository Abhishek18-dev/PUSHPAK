export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  MFA_VERIFY: '/auth/mfa/verify',
  LOGOUT: '/auth/logout',
  SESSION: '/auth/session',
  PASSWORD_CHANGE: '/auth/password/change',

  // Users & Roles (RBAC)
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_ROLES: (id: string) => `/users/${id}/roles`,

  // Simulations
  SIMULATIONS: '/simulations',
  SIMULATION_BY_ID: (id: string) => `/simulations/${id}`,
  SIMULATION_START: (id: string) => `/simulations/${id}/start`,
  SIMULATION_STOP: (id: string) => `/simulations/${id}/stop`,
  SIMULATION_RESET: (id: string) => `/simulations/${id}/reset`,
  SIMULATION_METRICS: (id: string) => `/simulations/${id}/metrics`,
  SIMULATION_METRICS_SUMMARY: (id: string) => `/simulations/${id}/metrics/summary`,

  // Emitters & Receiver
  EMITTERS: '/emitters',
  EMITTER_BY_ID: (id: string) => `/emitters/${id}`,
  RECEIVER_CONFIG: '/receiver/config',
  RECEIVER_STATUS: '/receiver/status',

  // Scheduler
  SCHEDULER_STATUS: '/scheduler/status',
  SCHEDULER_POLICY: '/scheduler/policy',
  SCHEDULER_STEP: '/scheduler/step',
  SCHEDULER_DECISIONS: '/scheduler/decisions',

  // Experiments
  EXPERIMENTS: '/experiments',
  EXPERIMENT_BY_ID: (id: string) => `/experiments/${id}`,
  EXPERIMENT_RUN: (id: string) => `/experiments/${id}/run`,
  EXPERIMENT_COMPARISON: (id: string) => `/experiments/${id}/comparison`,

  // Model Registry
  MODELS: '/models',
  MODEL_BY_ID: (id: string) => `/models/${id}`,
  MODEL_TRAIN: '/models/train',
  MODEL_EVALUATE: (id: string) => `/models/${id}/evaluate`,
  MODEL_REQUEST_ACTIVATION: (id: string) => `/models/${id}/request-activation`,
  MODEL_APPROVE: (id: string) => `/models/${id}/approve`,
  MODEL_ROLLBACK: (id: string) => `/models/${id}/rollback`,

  // Reports & Audit
  REPORTS: '/reports',
  REPORT_BY_ID: (id: string) => `/reports/${id}`,
  REPORT_DOWNLOAD: (id: string) => `/reports/${id}/download`,
  AUDIT_LOG: '/audit-log',
  SECURITY_CONFIG: '/security/config',
};
