import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface WaterfallRasterProps {
  history: Array<{ step: number; occupancy: Record<string, boolean> }>;
  bandsCount?: number;
  activeBand?: number;
}

export const WaterfallRaster: React.FC<WaterfallRasterProps> = ({
  history = [],
  bandsCount = 16,
  activeBand = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RF WATERFALL RASTER (TIME × FREQ)</Text>
        <Text style={styles.activeBandText}>CURRENT SCAN: BAND #{activeBand}</Text>
      </View>

      {/* Band Frequency Scale Header */}
      <View style={styles.freqRow}>
        {Array.from({ length: bandsCount }).map((_, i) => (
          <View
            key={`band_hdr_${i}`}
            style={[
              styles.freqHeaderCell,
              i === activeBand && styles.activeFreqHeaderCell,
            ]}
          >
            <Text
              style={[
                styles.freqHeaderText,
                i === activeBand && styles.activeFreqHeaderText,
              ]}
            >
              B{i}
            </Text>
          </View>
        ))}
      </View>

      {/* Raster Grid */}
      <ScrollView style={styles.rasterBody} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.emptyRaster}>
            <Text style={styles.emptyText}>Awaiting RF spectrum pulses...</Text>
          </View>
        ) : (
          history.map((row, rowIdx) => (
            <View key={`wf_row_${rowIdx}`} style={styles.rasterRow}>
              {Array.from({ length: bandsCount }).map((_, colIdx) => {
                const isOccupied = Boolean(row.occupancy[String(colIdx)]);
                const isTuned = colIdx === activeBand && rowIdx === 0;

                let cellColor = 'rgba(10, 25, 15, 0.6)';
                if (isTuned) {
                  cellColor = colors.primary;
                } else if (isOccupied) {
                  cellColor = colors.crimson;
                }

                return (
                  <View
                    key={`wf_cell_${rowIdx}_${colIdx}`}
                    style={[
                      styles.rasterCell,
                      { backgroundColor: cellColor },
                      isOccupied && styles.cellGlow,
                    ]}
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDim,
    padding: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  activeBandText: {
    fontSize: 10,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  freqRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
    paddingBottom: 4,
    marginBottom: 4,
  },
  freqHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  activeFreqHeaderCell: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 4,
  },
  freqHeaderText: {
    fontSize: 9,
    fontFamily: typography.fontFamilyMono,
    color: colors.textMuted,
  },
  activeFreqHeaderText: {
    color: colors.primary,
    fontWeight: '700',
  },
  rasterBody: {
    maxHeight: 220,
  },
  rasterRow: {
    flexDirection: 'row',
    height: 6,
    marginBottom: 2,
  },
  rasterCell: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  cellGlow: {
    shadowColor: colors.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  emptyRaster: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
