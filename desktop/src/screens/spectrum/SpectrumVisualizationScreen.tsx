import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { TacticalCard } from '../../components/TacticalCard';
import { RadarScope } from '../../components/RadarScope';
import { WaterfallRaster } from '../../components/WaterfallRaster';
import { StatusBadge } from '../../components/StatusBadge';
import { store } from '../../state/store';

export const SpectrumVisualizationScreen: React.FC = () => {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsub = store.subscribe(() => setState({ ...store.getState() }));
    return () => unsub();
  }, []);

  const {
    activeSimulation,
    bandOccupancy,
    tunedBands,
    waterfallHistory,
    latestDecision,
  } = state;

  const totalBands = activeSimulation?.bands || 16;
  const activeBand = latestDecision?.action?.next_band ?? tunedBands[0] ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>RF SPECTRUM & SENSOR VISUALIZATION</Text>
        <Text style={styles.subtitle}>
          Real-time energy detection, 2D spectrogram waterfall, and 360° PPI tactical radar
        </Text>
      </View>

      {/* Top Split: Radar Scope & RF Power Spectrum Grid */}
      <View style={styles.topSplit}>
        {/* Radar Scope */}
        <TacticalCard
          title="TACTICAL PPI RADAR SCOPE"
          subtitle="Spatial bearing & active target vectors"
          style={styles.radarBox}
        >
          <RadarScope
            size={300}
            bandOccupancy={bandOccupancy}
            tunedBands={tunedBands}
            totalBands={totalBands}
          />
        </TacticalCard>

        {/* Live Channel Power Grid */}
        <TacticalCard
          title="FREQUENCY CHANNEL POWER MATRIX"
          subtitle={`${totalBands} contiguous RF sub-bands`}
          style={styles.powerBox}
        >
          <View style={styles.channelGrid}>
            {Array.from({ length: totalBands }).map((_, bandIdx) => {
              const isOccupied = Boolean(bandOccupancy[String(bandIdx)]);
              const isTuned = bandIdx === activeBand;
              const powerDbm = isOccupied ? -45 - (bandIdx % 5) * 3 : -95 - (bandIdx % 4);

              return (
                <View
                  key={`pwr_band_${bandIdx}`}
                  style={[
                    styles.channelCell,
                    isTuned && styles.channelCellTuned,
                    isOccupied && styles.channelCellOccupied,
                  ]}
                >
                  <View style={styles.channelHeader}>
                    <Text style={[styles.channelNum, isTuned && styles.textTuned]}>B#{bandIdx}</Text>
                    <StatusBadge
                      status={isTuned ? 'TUNED' : isOccupied ? 'SIGNAL' : 'CLEAR'}
                      variant={isTuned ? 'green' : isOccupied ? 'crimson' : 'neutral'}
                    />
                  </View>
                  <Text style={[styles.powerVal, isOccupied ? styles.textCrimson : styles.textMuted]}>
                    {powerDbm} dBm
                  </Text>
                  <View style={styles.signalMeterTrack}>
                    <View
                      style={[
                        styles.signalMeterFill,
                        {
                          width: `${Math.min(Math.max((powerDbm + 110) * 1.5, 5), 100)}%`,
                          backgroundColor: isTuned ? colors.primary : isOccupied ? colors.crimson : colors.cyan,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </TacticalCard>
      </View>

      {/* Bottom: Extended Waterfall Spectrogram */}
      <TacticalCard
        title="MULTI-CHANNEL SPECTROGRAM WATERFALL (TIME-FREQUENCY EVOLUTION)"
        subtitle="Historical signal pulse bursts across simulation time-slices"
      >
        <WaterfallRaster
          history={waterfallHistory}
          bandsCount={totalBands}
          activeBand={activeBand}
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
  topSplit: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  radarBox: {
    width: 340,
    alignItems: 'center',
  },
  powerBox: {
    flex: 1,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  channelCell: {
    width: '23%',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.borderDim,
    borderRadius: 8,
    padding: spacing.sm,
  },
  channelCellTuned: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  channelCellOccupied: {
    borderColor: colors.crimsonDim,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelNum: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: typography.fontFamilyMono,
  },
  textTuned: {
    color: colors.primary,
  },
  powerVal: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
    marginBottom: 4,
  },
  textCrimson: {
    color: colors.crimson,
  },
  textMuted: {
    color: colors.textMuted,
  },
  signalMeterTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  signalMeterFill: {
    height: '100%',
    borderRadius: 2,
  },
});
