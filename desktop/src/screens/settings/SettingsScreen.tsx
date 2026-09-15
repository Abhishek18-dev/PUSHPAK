import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { StatusBadge } from '../../components/StatusBadge';

export const SettingsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>WORKSTATION CONFIGURATION & SYSTEM HEALTH</Text>
        <Text style={styles.subtitle}>
          Secure Windows Workstation · Local loopback topology per FULL PROOF Architecture
        </Text>
      </View>

      <TacticalCard title="PROCESS TOPOLOGY & INTER-PROCESS BOUNDARIES">
        <View style={styles.list}>
          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>TIER 1 — DESKTOP UI PROCESS</Text>
              <Text style={styles.itemSub}>React Native for Windows / Native Local Process</Text>
            </View>
            <StatusBadge status="OPERATIONAL" variant="green" />
          </View>

          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>TIER 2 — JAVA / SPRING BOOT BACKEND</Text>
              <Text style={styles.itemSub}>Bound to 127.0.0.1:8080 (AuthN, Sim, StateBuilder, Metrics)</Text>
            </View>
            <StatusBadge status="OPERATIONAL" variant="green" />
          </View>

          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>TIER 3 — PYTHON AI/ML SERVICES</Text>
              <Text style={styles.itemSub}>AI-ML-1 (Bandit/DQN:8500), AI-ML-2 (Periodicity:8600)</Text>
            </View>
            <StatusBadge status="OPERATIONAL" variant="green" />
          </View>

          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>TIER 4 — POSTGRESQL DATABASE</Text>
              <Text style={styles.itemSub}>Bound to 127.0.0.1:5432 (Local persistence, strict RBAC)</Text>
            </View>
            <StatusBadge status="CONNECTED" variant="green" />
          </View>

          <View style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>REDIS DECOUPLING STATUS</Text>
              <Text style={styles.itemSub}>Decoupled per Stack.md (Zero external distributed cache required)</Text>
            </View>
            <StatusBadge status="DECOUPLED" variant="cyan" />
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
  title: {
    ...typography.titleSection,
    color: colors.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMono,
    marginTop: 2,
  },
});
