import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius } from '../theme';

interface RadarScopeProps {
  size?: number;
  bandOccupancy: Record<string, boolean>;
  tunedBands: number[];
  totalBands?: number;
}

export const RadarScope: React.FC<RadarScopeProps> = ({
  size = 280,
  bandOccupancy = {},
  tunedBands = [],
  totalBands = 16,
}) => {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSweepAngle((prev) => (prev + 4) % 360);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const center = size / 2;
  const radius = size / 2 - 10;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Concentric rings */}
      <View style={[styles.ring, { width: size - 20, height: size - 20, borderRadius: (size - 20) / 2 }]} />
      <View style={[styles.ring, { width: (size - 20) * 0.7, height: (size - 20) * 0.7, borderRadius: ((size - 20) * 0.7) / 2 }]} />
      <View style={[styles.ring, { width: (size - 20) * 0.4, height: (size - 20) * 0.4, borderRadius: ((size - 20) * 0.4) / 2 }]} />

      {/* Crosshairs */}
      <View style={[styles.crosshairH, { width: size - 20 }]} />
      <View style={[styles.crosshairV, { height: size - 20 }]} />

      {/* Radar Sweep Line */}
      <View
        style={[
          styles.sweepLine,
          {
            width: radius,
            transform: [
              { translateX: radius / 2 },
              { rotate: `${sweepAngle}deg` },
              { translateX: -radius / 2 },
            ],
          },
        ]}
      />

      {/* Target Pings mapped across bands */}
      {Array.from({ length: totalBands }).map((_, bandIdx) => {
        const angleRad = (bandIdx / totalBands) * 2 * Math.PI - Math.PI / 2;
        const dist = radius * (0.35 + (bandIdx % 3) * 0.25);
        const x = center + dist * Math.cos(angleRad) - 6;
        const y = center + dist * Math.sin(angleRad) - 6;

        const isOccupied = Boolean(bandOccupancy[String(bandIdx)]);
        const isTuned = tunedBands.includes(bandIdx);

        return (
          <View
            key={`band_${bandIdx}`}
            style={[
              styles.targetPoint,
              {
                left: x,
                top: y,
                backgroundColor: isTuned
                  ? colors.primary
                  : isOccupied
                  ? colors.crimson
                  : 'rgba(255, 255, 255, 0.2)',
                borderColor: isTuned ? '#4ade80' : isOccupied ? '#f87171' : 'transparent',
                borderWidth: isTuned || isOccupied ? 2 : 0,
              },
            ]}
          >
            {(isTuned || isOccupied) && (
              <View style={[styles.pulseRing, { borderColor: isTuned ? colors.primary : colors.crimson }]} />
            )}
          </View>
        );
      })}

      {/* Bearing markings */}
      <Text style={[styles.bearingText, { top: 4, left: center - 6 }]}>N</Text>
      <Text style={[styles.bearingText, { bottom: 4, left: center - 6 }]}>S</Text>
      <Text style={[styles.bearingText, { right: 4, top: center - 6 }]}>E</Text>
      <Text style={[styles.bearingText, { left: 4, top: center - 6 }]}>W</Text>

      {/* Center Reticle */}
      <View style={styles.centerDot} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(2, 10, 5, 0.95)',
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  crosshairH: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  sweepLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(74, 222, 128, 0.8)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  targetPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.7,
  },
  bearingText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fontFamilyTactical,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
