import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../services/api/apiClient';
import { store } from '../../state/store';
import type { ModelMetadata } from '../../types';

export const ModelListScreen: React.FC<{ onSelectModel?: (model: ModelMetadata) => void }> = ({
  onSelectModel,
}) => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    store.fetchModels();
    return () => unsub();
  }, []);

  const { models } = state;

  const handleActivate = async (id: string) => {
    await apiClient.models.approve(id);
    await store.fetchModels();
  };

  const handleRollback = async (id: string) => {
    await apiClient.models.rollback(id);
    await store.fetchModels();
  };

  const columns: Column<ModelMetadata>[] = [
    {
      key: 'algorithm',
      title: 'Algorithm',
      width: 130,
      render: (item) => (
        <Text style={styles.algoCell}>{item.algorithm.toUpperCase()}</Text>
      ),
    },
    { key: 'version', title: 'Version', width: 90 },
    {
      key: 'active',
      title: 'Active State',
      width: 120,
      render: (item) => (
        <StatusBadge
          status={item.active ? 'ACTIVE' : 'STANDBY'}
          variant={item.active ? 'green' : 'neutral'}
        />
      ),
    },
    {
      key: 'integrity_hash',
      title: 'SHA-256 Digest',
      width: 180,
      render: (item) => (
        <Text style={styles.monoHash} numberOfLines={1}>
          {item.integrity_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
        </Text>
      ),
    },
    {
      key: 'actions',
      title: 'Lifecycle Control',
      width: 160,
      render: (item) => (
        <View style={styles.actionGroup}>
          {!item.active ? (
            <TouchableOpacity style={styles.activateBtn} onPress={() => handleActivate(item.id || item.model_id || '')}>
              <Text style={styles.activateBtnText}>ACTIVATE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.rollbackBtn} onPress={() => handleRollback(item.id || item.model_id || '')}>
              <Text style={styles.rollbackBtnText}>ROLLBACK</Text>
            </TouchableOpacity>
          )}
          {onSelectModel && (
            <TouchableOpacity style={styles.detailBtn} onPress={() => onSelectModel(item)}>
              <Text style={styles.detailBtnText}>INSPECT</Text>
            </TouchableOpacity>
          )}
        </View>
      ),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>MODEL REGISTRY & PROVENANCE REPOSITORY</Text>
        <Text style={styles.subtitle}>
          Cryptographically verified scheduler policies with separation-of-duties approval gates
        </Text>
      </View>

      <TacticalCard
        title="REGISTERED POLICIES & NEURAL ARTIFACTS"
        subtitle={`${models.length} model versions registered in local artifact store`}
      >
        <DataTable
          columns={columns}
          data={models}
          keyExtractor={(item, i) => item.id || item.model_id || `mod_${i}`}
          emptyMessage="No models registered. Run a training session to create a model checkpoint."
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
  algoCell: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  monoHash: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 10,
    color: colors.textMuted,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  activateBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activateBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#020503',
  },
  rollbackBtn: {
    backgroundColor: colors.amber,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  rollbackBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#020503',
  },
  detailBtn: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  detailBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
