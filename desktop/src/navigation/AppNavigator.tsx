import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { HeaderBar } from '../components/HeaderBar';
import { SidebarNav } from '../components/SidebarNav';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MfaScreen } from '../screens/auth/MfaScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SimulationSetupScreen } from '../screens/simulation/SimulationSetupScreen';
import { SimulationListScreen } from '../screens/simulation/SimulationListScreen';
import { SpectrumVisualizationScreen } from '../screens/spectrum/SpectrumVisualizationScreen';
import { SchedulerMonitorScreen } from '../screens/scheduler/SchedulerMonitorScreen';
import { TrainingScreen } from '../screens/ml/TrainingScreen';
import { ModelListScreen } from '../screens/ml/ModelListScreen';
import { ExperimentManagerScreen } from '../screens/experiments/ExperimentManagerScreen';
import { MetricsDashboardScreen } from '../screens/analytics/MetricsDashboardScreen';
import { BaselineVsMlScreen } from '../screens/analytics/BaselineVsMlScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { UserManagementScreen } from '../screens/settings/UserManagementScreen';
import { AuditViewerScreen } from '../screens/settings/AuditViewerScreen';

import { store } from '../state/store';
import { authManager } from '../services/api/authInterceptor';
import type { PolicyType } from '../types';

export const AppNavigator: React.FC = () => {
  const [state, setState] = useState(store.getState());
  const [mfaPending, setMfaPending] = useState(false);

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return () => unsub();
  }, []);

  const { activeTab, isAuthenticated, currentUser, activePolicy, isWsConnected, activeSimulation } = state;

  const handleLoginSuccess = (user: any, mfaRequired: boolean) => {
    if (mfaRequired) {
      setMfaPending(true);
    } else {
      store.setState({ isAuthenticated: true, currentUser: user });
    }
  };

  const handleMfaSuccess = () => {
    setMfaPending(false);
    store.setState({ isAuthenticated: true });
  };

  const handleLogout = () => {
    authManager.clearSession();
    store.setState({ isAuthenticated: false, currentUser: null });
  };

  const handlePolicySelect = (p: PolicyType) => {
    store.setPolicy(p);
  };

  const handleTabChange = (tabId: string) => {
    store.setActiveTab(tabId);
  };

  if (!isAuthenticated) {
    if (mfaPending) {
      return <MfaScreen onMfaSuccess={handleMfaSuccess} onCancel={() => setMfaPending(false)} />;
    }
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'simulation':
        return <SimulationSetupScreen />;
      case 'spectrum':
        return <SpectrumVisualizationScreen />;
      case 'scheduler':
        return <SchedulerMonitorScreen />;
      case 'ml':
        return <TrainingScreen />;
      case 'experiments':
        return <ExperimentManagerScreen />;
      case 'analytics':
        return <BaselineVsMlScreen />;
      case 'settings':
        return <AuditViewerScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <HeaderBar
        activePolicy={activePolicy}
        onSelectPolicy={handlePolicySelect}
        isWsConnected={isWsConnected}
        activeSimulationName={activeSimulation?.name || 'SCENARIO-A (MULTI-EMITTER)'}
        operatorName={currentUser?.username || 'DRDO_OPERATOR_1'}
        operatorRole={currentUser?.role || 'RESEARCHER'}
        onLogout={handleLogout}
      />

      {/* Main Workspace: Sidebar Nav + Screen View */}
      <View style={styles.body}>
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
