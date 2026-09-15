import { store } from '../src/state/store';

describe('Desktop App State Store', () => {
  test('Initial state contains default defense configurations', () => {
    const s = store.getState();
    expect(s.activeTab).toBe('dashboard');
    expect(s.isAuthenticated).toBe(true);
    expect(s.activePolicy).toBe('bandit');
    expect(s.receiverConfig.bandwidth_k).toBe(1);
    expect(s.receiverConfig.dwell_ms).toBe(10);
  });

  test('Changing active tab updates state and triggers listeners', () => {
    let triggered = false;
    const unsub = store.subscribe(() => {
      triggered = true;
    });

    store.setActiveTab('spectrum');
    expect(store.getState().activeTab).toBe('spectrum');
    expect(triggered).toBe(true);

    unsub();
  });

  test('Setting policy updates active policy in state', () => {
    store.setPolicy('dqn');
    expect(store.getState().activePolicy).toBe('dqn');
  });
});
