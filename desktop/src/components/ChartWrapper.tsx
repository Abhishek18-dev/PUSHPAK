import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export interface MetricComparisonItem {
  policy: string;
  value: number;
  maxExpected?: number;
  unit?: string;
  isHigherBetter?: boolean;
}

interface ChartWrapperProps {
  title: string;
  metricKey: string;
  data: MetricComparisonItem[];
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  data,
}) => {
  const getPolicyColor = (policy: string) => {
    switch (policy.toLowerCase()) {
      case 'baseline':
        return colors.textMuted;
      case 'bandit':
        return colors.cyan;
      case 'q_learning':
        return colors.amber;
      case 'dqn':
        return colors.primary;
      case 'ppo':
        return '#a855f7';
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>

      <View style={styles.chartArea}>
        {data.map((item, idx) => {
          const maxVal = item.maxExpected || 1.0;
          const ratio = Math.min(Math.max(item.value / maxVal, 0.05), 1.0);
          const barColor = getPolicyColor(item.policy);

          return (
            <View key={`chart_item_${idx}`} style={styles.itemRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.policyLabel}>{item.policy.toUpperCase()}</Text>
                <Text style={[styles.valueLabel, { color: barColor }]}>
                  {item.value.toFixed(item.unit === '%' ? 1 : 3)}
                  {item.unit || ''}
                </Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(ratio * 100).toFixed(1)}%` as any,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDim,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  chartArea: {
    gap: spacing.sm,
  },
  itemRow: {
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  policyLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.textSecondary,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  barTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
