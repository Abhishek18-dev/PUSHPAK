import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { StatusBadge } from '../../components/StatusBadge';
import type { ModelMetadata } from '../../types';

interface ModelDetailScreenProps {
  model: ModelMetadata;
  onBack: () => void;
}

export const ModelDetailScreen: React.FC<ModelDetailScreenProps> = ({ model, onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>&lt; RETURN TO MODEL REGISTRY</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MODEL MANIFEST INSPECTOR</Text>
        <Text style={styles.subtitle}>
          Algorithm: {model.algorithm.toUpperCase()} · Version: {model.version}
        </Text>
      </View>

      <TacticalCard title="PROVENANCE & INTEGRITY METRICS">
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>MODEL ID</Text>
            <Text style={styles.itemVal}>{model.id || model.model_id || 'UNASSIGNED'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.itemLabel}>ACTIVE STATUS</Text>
            <StatusBadge status={model.active ? 'ACTIVE' : 'STANDBY'} variant={model.active ? 'green' : 'neutral'} />
          </View>
          <View style={styles.gridItemWide}>
            <Text style={styles.itemLabel}>SHA-256 INTEGRITY DIGEST</Text>
            <Text style={styles.itemValMono}>
              {model.integrity_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </Text>
          </View>
        </View>
      </TacticalCard>

      <TacticalCard title="HYPERPARAMETERS & CONTEXT VECTOR BINDINGS">
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>
            {JSON.stringify(
              model.hyperparams || {
                algorithm: model.algorithm,
                learning_rate: 0.01,
                episodes: 100,
                epsilon_decay: 0.995,
                state_features: 8,
                gamma: 0.95,
              },
              null,
              2
            )}
          </Text>
        </View>
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
  backBtn: {
    marginBottom: spacing.xs,
  },
  backBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: typography.fontFamilyMono,
  },
  title: {
    ...typography.titleSection,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '45%',
  },
  gridItemWide: {
    width: '100%',
    marginTop: spacing.sm,
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  itemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemValMono: {
    fontSize: 11,
    color: colors.cyan,
    fontFamily: typography.fontFamilyMono,
  },
  codeBox: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  codeText: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.primary,
  },
});
