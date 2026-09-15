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
      setSweepAngle((prev) => (prev + 3) % 360);
    }, 33);
    return () => clearInterval(timer);
  }, []);

  const center = size / 2;
  const radius = size / 2 - 12;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Concentric rings */}
      <View style={[styles.ring, { width: radius * 2, height: radius * 2, borderRadius: radius }]} />
      <View style={[styles.ring, { width: radius * 1.4, height: radius * 1.4, borderRadius: radius * 0.7 }]} />
      <View style={[styles.ring, { width: radius * 0.8, height: radius * 0.8, borderRadius: radius * 0.4 }]} />

      {/* Crosshairs */}
      <View style={[styles.crosshairH, { width: radius * 2 }]} />
      <View style={[styles.crosshairV, { height: radius * 2 }]} />

      {/* Center-Pinned Rotating Radar Antenna Beam & Sector */}
      <View
        style={[
          styles.pivotContainer,
          {
            top: center,
            left: center,
            transform: [{ rotate: `${sweepAngle}deg` }],
          },
        ]}
      >
        {/* Phosphor sweep tail gradient */}
        <View
          style={[
            styles.sweepTail,
            {
              width: radius,
              height: radius,
              top: -radius,
              left: 0,
            },
          ]}
        />
        {/* Main Radar Beam Line */}
        <View
          style={[
            styles.antennaBeam,
            {
              width: radius,
            },
          ]}
        />
        {/* Antenna Beam Tip */}
        <View
          style={[
            styles.beamTip,
            {
              left: radius - 4,
            },
          ]}
        />
      </View>

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
      <Text style={[styles.bearingText, { top: 4, left: center - 5 }]}>N</Text>
      <Text style={[styles.bearingText, { bottom: 4, left: center - 5 }]}>S</Text>
      <Text style={[styles.bearingText, { right: 4, top: center - 6 }]}>E</Text>
      <Text style={[styles.bearingText, { left: 4, top: center - 6 }]}>W</Text>

      {/* Center Reticle Origin Dot */}
      <View style={[styles.centerDot, { top: center - 4, left: center - 4 }]} />
      <View style={[styles.centerRing, { top: center - 8, left: center - 8 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#030d07',
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.4)',
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
  pivotContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 5,
  },
  antennaBeam: {
    position: 'absolute',
    top: -1,
    left: 0,
    height: 2,
    backgroundColor: '#4ade80',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  beamTip: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86efac',
    shadowColor: '#86efac',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  sweepTail: {
    position: 'absolute',
    borderBottomLeftRadius: 140,
    opacity: 0.25,
    // Web conic gradient tail
    ...(StyleSheet.create({
      gradient: {
        background: 'conic-gradient(from 180deg at 0% 100%, rgba(74, 222, 128, 0.35) 0deg, transparent 40deg)',
      } as any,
    }).gradient),
  },
  targetPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
    zIndex: 15,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    zIndex: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  centerRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    zIndex: 19,
    opacity: 0.6,
  },
});
