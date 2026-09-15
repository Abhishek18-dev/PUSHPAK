import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export interface Column<T> {
  key: string;
  title: string;
  width?: number | string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={[
              styles.headerCell,
              col.width ? { width: col.width as any, flex: undefined } : { flex: 1 },
            ]}
          >
            <Text style={styles.headerText}>{col.title}</Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      <ScrollView style={styles.bodyScroll}>
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          data.map((item, index) => (
            <View
              key={keyExtractor(item, index)}
              style={[
                styles.dataRow,
                index % 2 === 1 && styles.dataRowAlt,
              ]}
            >
              {columns.map((col) => (
                <View
                  key={col.key}
                  style={[
                    styles.cell,
                    col.width ? { width: col.width as any, flex: undefined } : { flex: 1 },
                  ]}
                >
                  {col.render ? (
                    col.render(item, index)
                  ) : (
                    <Text style={styles.cellText}>
                      {String((item as any)[col.key] ?? '')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDim,
    overflow: 'hidden',
    backgroundColor: colors.backgroundElevated,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 25, 15, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.xs,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bodyScroll: {
    maxHeight: 400,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  dataRowAlt: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cell: {
    paddingHorizontal: spacing.xs,
  },
  cellText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
