import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../services/api/apiClient';
import { store } from '../../state/store';
import type { Simulation } from '../../types';

export const SimulationListScreen: React.FC = () => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    store.fetchSimulations();
    return () => unsub();
  }, []);

  const { simulations, activeSimulationId } = state;

  const [simName, setSimName] = useState('Scenario-A Benchmark');
  const [bands, setBands] = useState('16');
  const [duration, setDuration] = useState('500');
  const [seed, setSeed] = useState('42');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await apiClient.simulations.create({
        name: simName,
        bands: parseInt(bands, 10) || 16,
        duration_steps: parseInt(duration, 10) || 500,
        seed: parseInt(seed, 10) || 42,
      });
      await store.fetchSimulations();
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sim: Simulation) => {
    store.setState({ activeSimulation: sim, activeSimulationId: sim.id });
    store.fetchEmitters(sim.id);
  };

  const columns: Column<Simulation>[] = [
    { key: 'name', title: 'Scenario / Simulation Name', width: 220 },
    { key: 'bands', title: 'Bands', width: 80 },
    { key: 'duration_steps', title: 'Steps', width: 90 },
    { key: 'seed', title: 'Random Seed', width: 100 },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      render: (item) => (
        <StatusBadge
          status={item.id === activeSimulationId ? 'ACTIVE' : item.status}
          variant={item.id === activeSimulationId ? 'green' : 'neutral'}
        />
      ),
    },
    {
      key: 'id',
      title: 'Action',
      width: 100,
      render: (item) => (
        <TouchableOpacity
          style={[styles.selectBtn, item.id === activeSimulationId && styles.selectBtnActive]}
          onPress={() => handleSelect(item)}
        >
          <Text style={[styles.selectBtnText, item.id === activeSimulationId && styles.selectBtnTextActive]}>
            {item.id === activeSimulationId ? 'LOADED' : 'SELECT'}
          </Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>SIMULATION REGISTRY</Text>
        <Text style={styles.subtitle}>Configured RF environments stored in local database</Text>
      </View>

      {/* New Simulation Form */}
      <TacticalCard
        title="INITIALIZE NEW RF SCENARIO"
        subtitle="Configure frequency bounds, duration steps, and deterministic PRNG seed"
        action={
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
            <Text style={styles.createBtnText}>{loading ? 'INITIALIZING...' : '+ CREATE SCENARIO'}</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.formRow}>
          <View style={styles.fieldWide}>
            <Text style={styles.label}>SCENARIO NAME</Text>
            <TextInput style={styles.input} value={simName} onChangeText={setSimName} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>BANDS (K)</Text>
            <TextInput style={styles.input} value={bands} onChangeText={setBands} keyboardType="number-pad" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>DURATION (STEPS)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>SEED</Text>
            <TextInput style={styles.input} value={seed} onChangeText={setSeed} keyboardType="number-pad" />
          </View>
        </View>
      </TacticalCard>

      {/* Simulation List */}
      <TacticalCard title="STORED SIMULATIONS" subtitle={`${simulations.length} scenarios registered locally`}>
        <DataTable
          columns={columns}
          data={simulations}
          keyExtractor={(item) => item.id}
          emptyMessage="No simulations registered. Create one above."
        />
      </TacticalCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSection,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  fieldWide: {
    flex: 2,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.borderDim,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
    fontSize: 12,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  createBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020503',
  },
  selectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderDim,
    backgroundColor: colors.backgroundElevated,
  },
  selectBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  selectBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  selectBtnTextActive: {
    color: colors.primary,
  },
});
