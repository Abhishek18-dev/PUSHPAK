import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius } from '../theme';

interface StatusBadgeProps {
  status: string;
  variant?: 'green' | 'amber' | 'crimson' | 'cyan' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  let activeColor = colors.primary;
  let activeBg = colors.primaryMuted;

  const s = status.toLowerCase();
  if (variant === 'amber' || s.includes('warn') || s.includes('pause') || s.includes('pending')) {
    activeColor = colors.amber;
    activeBg = colors.amberGlow;
  } else if (variant === 'crimson' || s.includes('fail') || s.includes('err') || s.includes('stop') || s.includes('denied')) {
    activeColor = colors.crimson;
    activeBg = colors.crimsonGlow;
  } else if (variant === 'cyan' || s.includes('ml') || s.includes('eval') || s.includes('bandit')) {
    activeColor = colors.cyan;
    activeBg = colors.cyanGlow;
  } else if (variant === 'neutral' || s.includes('draft') || s.includes('idle')) {
    activeColor = colors.textMuted;
    activeBg = 'rgba(100, 116, 139, 0.15)';
  }

  return (
    <View style={[styles.badge, { backgroundColor: activeBg, borderColor: activeColor }]}>
      <View style={[styles.dot, { backgroundColor: activeColor }]} />
      <Text style={[styles.text, { color: activeColor }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
