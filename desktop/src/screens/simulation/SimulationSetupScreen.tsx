import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../services/api/apiClient';
import { store } from '../../state/store';
import type { Emitter, ReceiverConfig, BehaviorClass } from '../../types';

export const SimulationSetupScreen: React.FC = () => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return () => unsub();
  }, []);

  const { activeSimulation, activeSimulationId, emitters, receiverConfig } = state;

  // Form states for new emitter
  const [emitterClass, setEmitterClass] = useState<BehaviorClass>('periodic');
  const [emitterBand, setEmitterBand] = useState('4');
  const [emitterPeriod, setEmitterPeriod] = useState('12');
  const [emitterPriority, setEmitterPriority] = useState('1');

  // Form state for receiver
  const [bandwidthK, setBandwidthK] = useState(String(receiverConfig?.bandwidth_k || 1));
  const [dwellMs, setDwellMs] = useState(String(receiverConfig?.dwell_ms || 10));
  const [tuningDelay, setTuningDelay] = useState(String(receiverConfig?.tuning_delay || 2));
  const [threshold, setThreshold] = useState(String(receiverConfig?.threshold || 0.5));

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleAddEmitter = async () => {
    if (!activeSimulationId) return;
    setSaving(true);
    try {
      await apiClient.emitters.create({
        simulation_id: activeSimulationId,
        behavior_class: emitterClass,
        band: parseInt(emitterBand, 10) || 0,
        period: parseInt(emitterPeriod, 10) || 10,
        priority: parseInt(emitterPriority, 10) || 1,
      });
      await store.fetchEmitters(activeSimulationId);
      setStatusMsg('Emitter deployed successfully.');
    } catch (err: any) {
      setStatusMsg('Error adding emitter.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmitter = async (id: string) => {
    if (!activeSimulationId) return;
    await apiClient.emitters.delete(id);
    await store.fetchEmitters(activeSimulationId);
  };

  const handleSaveReceiver = async () => {
    setSaving(true);
    try {
      await apiClient.receiver.updateConfig({
        simulation_id: activeSimulationId || undefined,
        bandwidth_k: parseInt(bandwidthK, 10) || 1,
        dwell_ms: parseInt(dwellMs, 10) || 10,
        tuning_delay: parseInt(tuningDelay, 10) || 2,
        threshold: parseFloat(threshold) || 0.5,
      });
      setStatusMsg('Receiver hardware constraints updated.');
    } catch (err: any) {
      setStatusMsg('Error updating receiver.');
    } finally {
      setSaving(false);
    }
  };

  const emitterColumns: Column<Emitter>[] = [
    { key: 'band', title: 'Band #', width: 80 },
    {
      key: 'behavior_class',
      title: 'Class',
      width: 140,
      render: (item) => (
        <StatusBadge
          status={item.behavior_class}
          variant={item.behavior_class === 'periodic' ? 'cyan' : item.behavior_class === 'agile' ? 'amber' : 'green'}
        />
      ),
    },
    { key: 'period', title: 'Period (T)', width: 100 },
    { key: 'priority', title: 'Priority Weight', width: 120 },
    {
      key: 'id',
      title: 'Action',
      width: 80,
      render: (item) => (
        <TouchableOpacity onPress={() => handleDeleteEmitter(item.id)}>
          <Text style={{ color: colors.crimson, fontSize: 11, fontWeight: '700' }}>REMOVE</Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topHeader}>
        <Text style={styles.title}>SCENARIO & EMITTER CONFIGURATION</Text>
        <Text style={styles.subtitle}>
          Active Scenario: {activeSimulation?.name || 'Scenario-A'} · {activeSimulation?.bands || 16} Frequency Bands
        </Text>
      </View>

      {statusMsg && (
        <View style={styles.statusToast}>
          <Text style={styles.toastText}>{statusMsg}</Text>
        </View>
      )}

      {/* Receiver Constraints Form */}
      <TacticalCard
        title="RECEIVER RF HARDWARE MODEL"
        subtitle="Physical tuning constraints & energy detection threshold"
        action={
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReceiver} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'APPLY CONFIG'}</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>BANDWIDTH K (# BANDS)</Text>
            <TextInput
              style={styles.input}
              value={bandwidthK}
              onChangeText={setBandwidthK}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>DWELL TIME T_dwell (MS)</Text>
            <TextInput
              style={styles.input}
              value={dwellMs}
              onChangeText={setDwellMs}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>TUNING DELAY T_tune (MS)</Text>
            <TextInput
              style={styles.input}
              value={tuningDelay}
              onChangeText={setTuningDelay}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>DETECTION THRESHOLD (TH)</Text>
            <TextInput
              style={styles.input}
              value={threshold}
              onChangeText={setThreshold}
            />
          </View>
        </View>
      </TacticalCard>

      {/* Deploy New Emitter */}
      <TacticalCard
        title="DEPLOY SYNTHETIC RF EMITTER"
        subtitle="Inject signals across fixed, periodic, agile, random, or intermittent classes"
        action={
          <TouchableOpacity style={styles.addBtn} onPress={handleAddEmitter} disabled={saving}>
            <Text style={styles.addBtnText}>+ DEPLOY EMITTER</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>BEHAVIOR CLASS</Text>
            <View style={styles.pillGroup}>
              {(['fixed', 'periodic', 'agile', 'random', 'intermittent'] as BehaviorClass[]).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pill, emitterClass === c && styles.pillActive]}
                  onPress={() => setEmitterClass(c)}
                >
                  <Text style={[styles.pillText, emitterClass === c && styles.pillTextActive]}>
                    {c.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>BAND #</Text>
            <TextInput
              style={styles.input}
              value={emitterBand}
              onChangeText={setEmitterBand}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>PERIOD (T)</Text>
            <TextInput
              style={styles.input}
              value={emitterPeriod}
              onChangeText={setEmitterPeriod}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldSmall}>
            <Text style={styles.label}>PRIORITY</Text>
            <TextInput
              style={styles.input}
              value={emitterPriority}
              onChangeText={setEmitterPriority}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </TacticalCard>

      {/* Deployed Emitters List */}
      <TacticalCard
        title="ACTIVE EMITTER MANIFEST"
        subtitle={`${emitters.length} synthetic targets active in scenario`}
      >
        <DataTable
          columns={emitterColumns}
          data={emitters}
          keyExtractor={(item) => item.id}
          emptyMessage="No emitters deployed in current simulation."
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
  topHeader: {
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
  statusToast: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  toastText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  field: {
    flex: 1,
  },
  fieldSmall: {
    width: 100,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    letterSpacing: 0.6,
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
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  pillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMono,
  },
  pillTextActive: {
    color: colors.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  saveBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020503',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  addBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020503',
  },
});
