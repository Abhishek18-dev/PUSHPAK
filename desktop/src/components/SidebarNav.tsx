import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export interface NavItem {
  id: string;
  label: string;
  badge?: string;
}

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Command Center' },
    { id: 'simulation', label: 'Simulations & Emitters' },
    { id: 'spectrum', label: 'Spectrum & Radar' },
    { id: 'scheduler', label: 'Scheduler Monitor' },
    { id: 'ml', label: 'AI/ML Models & Train' },
    { id: 'experiments', label: 'Policy Shootout' },
    { id: 'analytics', label: 'Metrics & Analytics' },
    { id: 'settings', label: 'Security & Audit' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TACTICAL WORKSTATION</Text>
      </View>

      <View style={styles.navList}>
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onTabChange(item.id)}
            >
              <View style={[styles.activeIndicator, isActive && styles.activeIndicatorVisible]} />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* System Status Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>STATUS: ARMED</Text>
        <Text style={styles.footerSub}>DRDO / LOCAL INSTANCE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: 'rgba(3, 10, 5, 0.95)',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.md,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDim,
    letterSpacing: 1.2,
  },
  navList: {
    flex: 1,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.xs,
  },
  navItemActive: {
    backgroundColor: colors.primaryMuted,
  },
  activeIndicator: {
    width: 3,
    height: 14,
    backgroundColor: 'transparent',
    borderRadius: 2,
    marginRight: 8,
  },
  activeIndicatorVisible: {
    backgroundColor: colors.primary,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: colors.amberGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 9,
    color: colors.amber,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderDim,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  footerSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
