import { apiClient } from '../src/services/api/apiClient';
import { ENDPOINTS } from '../src/services/api/endpoints';
import { authManager } from '../src/services/api/authInterceptor';

describe('Desktop API Client & Endpoints', () => {
  beforeEach(() => {
    authManager.clearSession();
  });

  test('Endpoints are correctly formatted per FULL PROOF specification', () => {
    expect(ENDPOINTS.LOGIN).toBe('/auth/login');
    expect(ENDPOINTS.SIMULATIONS).toBe('/simulations');
    expect(ENDPOINTS.SIMULATION_BY_ID('sim_1')).toBe('/simulations/sim_1');
    expect(ENDPOINTS.SCHEDULER_POLICY).toBe('/scheduler/policy');
    expect(ENDPOINTS.EXPERIMENTS).toBe('/experiments');
    expect(ENDPOINTS.EXPERIMENT_RUN('exp_1')).toBe('/experiments/exp_1/run');
    expect(ENDPOINTS.MODELS).toBe('/models');
    expect(ENDPOINTS.AUDIT_LOG).toBe('/audit-log');
  });

  test('AuthTokenManager correctly stores and retrieves local session tokens', () => {
    expect(authManager.getToken()).toBeNull();
    authManager.setToken('test_token_xyz');
    expect(authManager.getToken()).toBe('test_token_xyz');
    authManager.clearSession();
    expect(authManager.getToken()).toBeNull();
  });

  test('apiClient provides all required tier-1 modules', () => {
    expect(apiClient.auth).toBeDefined();
    expect(apiClient.simulations).toBeDefined();
    expect(apiClient.emitters).toBeDefined();
    expect(apiClient.receiver).toBeDefined();
    expect(apiClient.scheduler).toBeDefined();
    expect(apiClient.experiments).toBeDefined();
    expect(apiClient.models).toBeDefined();
    expect(apiClient.reports).toBeDefined();
    expect(apiClient.audit).toBeDefined();
  });
});
