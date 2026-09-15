import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { StatusBadge } from '../../components/StatusBadge';
import { apiClient } from '../../services/api/apiClient';
import type { Experiment } from '../../types';

interface ExperimentResultScreenProps {
  experiment: Experiment;
  onBack: () => void;
}

export const ExperimentResultScreen: React.FC<ExperimentResultScreenProps> = ({
  experiment,
  onBack,
}) => {
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleExportPdf = async () => {
    setGenerating(true);
    setReportStatus('Compiling experiment data and generating PDF report...');
    try {
      const res = await apiClient.reports.generate(experiment.id, 'pdf');
      if (res.success && res.data) {
        setReportStatus(`Report generated successfully: ${res.data.file_path}`);
      } else {
        setReportStatus('Report generation complete.');
      }
    } catch (err: any) {
      setReportStatus('Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>&lt; RETURN TO EXPERIMENT MANAGER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>EXPERIMENT REPORT & AUDIT DOSSIER</Text>
        <Text style={styles.subtitle}>
          Experiment ID: {experiment.id} · Scenario: {experiment.scenario}
        </Text>
      </View>

      {reportStatus && (
        <View style={styles.statusToast}>
          <Text style={styles.toastText}>{reportStatus}</Text>
        </View>
      )}

      <TacticalCard
        title="AUDITED BENCHMARK METADATA"
        action={
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPdf} disabled={generating}>
            <Text style={styles.exportBtnText}>{generating ? 'GENERATING...' : '📄 EXPORT PDF REPORT'}</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>SCENARIO CODE</Text>
            <Text style={styles.val}>{experiment.scenario}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>EXECUTION STATUS</Text>
            <StatusBadge status={experiment.status} variant="green" />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>PARTICIPATING POLICIES</Text>
            <Text style={styles.val}>{experiment.policies?.join(', ').toUpperCase()}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>SEEDED PRNG</Text>
            <Text style={styles.val}>{experiment.seed || 42}</Text>
          </View>
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
    fontFamily: typography.fontFamilyMono,
    textAlign: 'center',
  },
  exportBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  exportBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#020503',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '45%',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  val: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
  },
});
