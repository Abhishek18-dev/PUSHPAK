import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';

interface TacticalCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: 'green' | 'amber' | 'crimson' | 'cyan';
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  title,
  subtitle,
  action,
  children,
  style,
  accent = 'green',
}) => {
  const getBorderColor = () => {
    switch (accent) {
      case 'amber':
        return colors.amberDim;
      case 'crimson':
        return colors.crimsonDim;
      case 'cyan':
        return colors.cyanDim;
      default:
        return colors.border;
    }
  };

  return (
    <View style={[styles.card, { borderColor: getBorderColor() }, style]}>
      {(title || action) && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {action && <View style={styles.actionContainer}>{action}</View>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.titleCard,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
  },
});
