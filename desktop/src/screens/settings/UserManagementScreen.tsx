import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';

interface UserRoleRow {
  role: string;
  permissions: string;
  scope: string;
}

export const UserManagementScreen: React.FC = () => {
  const roles: UserRoleRow[] = [
    {
      role: 'RESEARCHER',
      permissions: 'Configure simulations, Run scans, Evaluate metrics',
      scope: 'Standard Research Loop',
    },
    {
      role: 'ML_ENGINEER',
      permissions: 'Train policies, Evaluate models, Request model activation',
      scope: 'AI/ML Training & Staging',
    },
    {
      role: 'ANALYST',
      permissions: 'View reports, Export PDFs, Inspect telemetry',
      scope: 'Read-only Analytics',
    },
    {
      role: 'AUDITOR',
      permissions: 'Read append-only audit trail, Inspect security logs',
      scope: 'Compliance & Integrity',
    },
    {
      role: 'SECURITY_ADMIN',
      permissions: 'Approve model activation, Rollback models, Update security policies',
      scope: 'Separation of Duties Gate',
    },
    {
      role: 'SYSTEM_ADMIN',
      permissions: 'User management, Workstation provisioning, Key lifecycle',
      scope: 'Local Workstation Admin',
    },
  ];

  const columns: Column<UserRoleRow>[] = [
    {
      key: 'role',
      title: 'RBAC Role',
      width: 160,
      render: (item) => (
        <StatusBadge
          status={item.role}
          variant={item.role.includes('ADMIN') ? 'amber' : item.role.includes('ML') ? 'cyan' : 'green'}
        />
      ),
    },
    { key: 'permissions', title: 'Granted Capabilities', width: 340 },
    { key: 'scope', title: 'Operational Domain', width: 200 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>RBAC USER & ROLE MANAGEMENT</Text>
        <Text style={styles.subtitle}>
          Principle of least privilege & separation of duties per PRD & Architecture specification
        </Text>
      </View>

      <TacticalCard
        title="ROLE-BASED ACCESS CONTROL (RBAC) MATRIX"
        subtitle="Mandatory cryptographic separation between ML training and production activation"
      >
        <DataTable
          columns={columns}
          data={roles}
          keyExtractor={(item) => item.role}
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
});
