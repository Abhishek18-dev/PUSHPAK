import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { StatusBadge } from './StatusBadge';
import type { PolicyType } from '../types';

interface HeaderBarProps {
  activePolicy: PolicyType;
  onSelectPolicy: (policy: PolicyType) => void;
  isWsConnected: boolean;
  activeSimulationName?: string;
  operatorName?: string;
  operatorRole?: string;
  onLogout?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activePolicy,
  onSelectPolicy,
  isWsConnected,
  activeSimulationName = 'SCENARIO-A (DEFAULT)',
  operatorName = 'DRDO_OPERATOR_1',
  operatorRole = 'RESEARCHER',
  onLogout,
}) => {
  const policies: PolicyType[] = ['baseline', 'bandit', 'q_learning', 'dqn', 'ppo'];

  return (
    <View style={styles.container}>
      {/* Brand & System Title */}
      <View style={styles.brandSection}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>RF</Text>
        </View>
        <View>
          <Text style={styles.title}>INTELLIGENT RF SPECTRUM SCANNER</Text>
          <Text style={styles.subtitle}>SECURE WINDOWS WORKSTATION · FULL PROOF TIER-1</Text>
        </View>
      </View>

      {/* Active Sim & WS Status */}
      <View style={styles.centerSection}>
        <View style={styles.simBadge}>
          <Text style={styles.simLabel}>SIMULATION:</Text>
          <Text style={styles.simValue}>{activeSimulationName}</Text>
        </View>
        <StatusBadge
          status={isWsConnected ? 'WS LIVE' : 'WS OFFLINE'}
          variant={isWsConnected ? 'green' : 'crimson'}
        />
      </View>

      {/* Policy Selection Pills */}
      <View style={styles.policySection}>
        <Text style={styles.policyHeader}>POLICY:</Text>
        {policies.map((p) => {
          const isActive = p === activePolicy;
          return (
            <TouchableOpacity
              key={`policy_pill_${p}`}
              style={[
                styles.policyPill,
                isActive && styles.policyPillActive,
              ]}
              onPress={() => onSelectPolicy(p)}
            >
              <Text
                style={[
                  styles.policyPillText,
                  isActive && styles.policyPillTextActive,
                ]}
              >
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User & Role Badge */}
      <View style={styles.userSection}>
        <View style={styles.userBadge}>
          <Text style={styles.userName}>{operatorName}</Text>
          <Text style={styles.userRole}>{operatorRole}</Text>
        </View>
        {onLogout && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>EXIT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4, 12, 7, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: typography.fontFamilyTactical,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.1,
  },
  subtitle: {
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  simBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  simLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  simValue: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  policySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  policyHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: 4,
  },
  policyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderDim,
    backgroundColor: colors.backgroundElevated,
  },
  policyPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  policyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: typography.fontFamilyMono,
  },
  policyPillTextActive: {
    color: colors.primary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userBadge: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
  },
  userRole: {
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.crimsonDim,
    backgroundColor: colors.crimsonGlow,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.crimson,
  },
});
