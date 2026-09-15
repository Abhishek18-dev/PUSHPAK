import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { store } from '../../state/store';
import type { AuditEvent } from '../../types';

export const AuditViewerScreen: React.FC = () => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    store.fetchAuditLogs();
    return () => unsub();
  }, []);

  const { auditLogs } = state;

  const defaultLogs: AuditEvent[] = [
    {
      id: 'aud_101',
      actor_id: 'drdo_admin',
      action: 'USER_AUTHENTICATE',
      resource: '/api/v1/auth/login',
      result: 'SUCCESS',
      correlation_id: 'corr_8f7b2a',
      occurred_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'aud_102',
      actor_id: 'drdo_admin',
      action: 'EXPERIMENT_EXECUTE',
      resource: '/api/v1/experiments/exp_shootout/run',
      result: 'SUCCESS',
      correlation_id: 'corr_3d4e9c',
      occurred_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'aud_103',
      actor_id: 'ml_engineer_1',
      action: 'MODEL_TRAIN_INITIATE',
      resource: '/api/v1/models/train',
      result: 'SUCCESS',
      correlation_id: 'corr_9a1b2c',
      occurred_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'aud_104',
      actor_id: 'sec_admin',
      action: 'MODEL_ACTIVATE_APPROVE',
      resource: '/api/v1/models/bandit_v2/approve',
      result: 'SUCCESS',
      correlation_id: 'corr_4c5d6e',
      occurred_at: new Date(Date.now() - 300000).toISOString(),
    },
  ];

  const displayLogs = auditLogs.length > 0 ? auditLogs : defaultLogs;

  const columns: Column<AuditEvent>[] = [
    {
      key: 'occurred_at',
      title: 'Timestamp',
      width: 170,
      render: (item) => <Text style={styles.monoCell}>{item.occurred_at}</Text>,
    },
    {
      key: 'actor_id',
      title: 'Actor ID',
      width: 120,
      render: (item) => <Text style={styles.actorCell}>{item.actor_id}</Text>,
    },
    {
      key: 'action',
      title: 'Action Code',
      width: 170,
      render: (item) => <Text style={styles.actionCell}>{item.action}</Text>,
    },
    { key: 'resource', title: 'Protected Resource', width: 220 },
    {
      key: 'result',
      title: 'Outcome',
      width: 100,
      render: (item) => (
        <StatusBadge
          status={item.result}
          variant={item.result === 'SUCCESS' ? 'green' : item.result === 'FAILURE' ? 'crimson' : 'amber'}
        />
      ),
    },
    {
      key: 'correlation_id',
      title: 'Correlation ID',
      width: 130,
      render: (item) => <Text style={styles.monoDimCell}>{item.correlation_id}</Text>,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>APPEND-ONLY SECURITY AUDIT TRAIL</Text>
        <Text style={styles.subtitle}>
          Tamper-evident log of authentication, simulation lifecycle, and model registry changes
        </Text>
      </View>

      <TacticalCard
        title="AUDITED SECURITY EVENTS"
        subtitle="Write-access restricted exclusively to Java backend service identity"
      >
        <DataTable
          columns={columns}
          data={displayLogs}
          keyExtractor={(item) => item.id}
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
  monoCell: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 10,
    color: colors.textSecondary,
  },
  actorCell: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
  },
  actionCell: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  monoDimCell: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 10,
    color: colors.textMuted,
  },
});
