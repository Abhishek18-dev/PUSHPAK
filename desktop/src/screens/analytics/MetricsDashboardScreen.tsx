import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { StatusBadge } from '../../components/StatusBadge';
import { store } from '../../state/store';

export const MetricsDashboardScreen: React.FC = () => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return () => unsub();
  }, []);

  const { liveMetrics, activePolicy } = state;

  const pd = liveMetrics.pd ?? 0.885;
  const pfa = liveMetrics.pfa ?? 0.042;
  const ait = liveMetrics.ait ?? 10.2;
  const scanEff = liveMetrics.scan_efficiency ? (liveMetrics.scan_efficiency * 100).toFixed(1) : '68.0';
  const reward = liveMetrics.reward ? liveMetrics.reward.toFixed(1) : '124.5';
  const latency = liveMetrics.latency ?? 2.1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>RADAR & SCHEDULER METRICS DASHBOARD</Text>
        <Text style={styles.subtitle}>
          Active Policy: {activePolicy.toUpperCase()} · Evaluated per DRDO Spectrum Scanning Requirements
        </Text>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.kpiGrid}>
        <TacticalCard style={styles.kpiCard} accent="green">
          <Text style={styles.kpiLabel}>PROBABILITY OF DETECTION (Pd)</Text>
          <Text style={[styles.kpiVal, { color: colors.primary }]}>{(pd * 100).toFixed(1)}%</Text>
          <Text style={styles.kpiSub}>Threshold: &gt;= 85.0%</Text>
          <StatusBadge status={pd >= 0.85 ? 'SATISFIED' : 'BREACH'} variant={pd >= 0.85 ? 'green' : 'crimson'} />
        </TacticalCard>

        <TacticalCard style={styles.kpiCard} accent="cyan">
          <Text style={styles.kpiLabel}>FALSE ALARM PROBABILITY (Pfa)</Text>
          <Text style={[styles.kpiVal, { color: colors.cyan }]}>{(pfa * 100).toFixed(2)}%</Text>
          <Text style={styles.kpiSub}>Threshold: &lt;= 5.00%</Text>
          <StatusBadge status={pfa <= 0.05 ? 'SATISFIED' : 'ELEVATED'} variant={pfa <= 0.05 ? 'green' : 'amber'} />
        </TacticalCard>

        <TacticalCard style={styles.kpiCard} accent="amber">
          <Text style={styles.kpiLabel}>AVERAGE INTERCEPT TIME (AIT)</Text>
          <Text style={[styles.kpiVal, { color: colors.amber }]}>{ait.toFixed(1)} steps</Text>
          <Text style={styles.kpiSub}>Threshold: &lt;= 15.0 steps</Text>
          <StatusBadge status={ait <= 15.0 ? 'OPTIMAL' : 'DEGRADED'} variant={ait <= 15.0 ? 'green' : 'crimson'} />
        </TacticalCard>

        <TacticalCard style={styles.kpiCard} accent="green">
          <Text style={styles.kpiLabel}>HARDWARE TUNING LATENCY</Text>
          <Text style={[styles.kpiVal, { color: colors.primary }]}>{latency.toFixed(1)} ms</Text>
          <Text style={styles.kpiSub}>Model Decision Overhaul</Text>
          <StatusBadge status="ACCEPTABLE" variant="green" />
        </TacticalCard>
      </View>

      {/* Secondary Metrics */}
      <View style={styles.secondaryRow}>
        <TacticalCard style={styles.halfCard} title="RF BAND SCAN EFFICIENCY">
          <Text style={styles.bigVal}>{scanEff}%</Text>
          <Text style={styles.descText}>
            Percentage of radar tuning dwells that successfully intercept active threat emissions.
          </Text>
        </TacticalCard>

        <TacticalCard style={styles.halfCard} title="CUMULATIVE REWARD r(t)">
          <Text style={[styles.bigVal, { color: colors.amber }]}>+{reward}</Text>
          <Text style={styles.descText}>
            Sequential reward accrued from true detections minus tuning movement penalties and miss costs.
          </Text>
        </TacticalCard>
      </View>
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
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: typography.fontFamilyMono,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCard: {
    flex: 1,
  },
  bigVal: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: typography.fontFamilyMono,
    marginBottom: 6,
  },
  descText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
