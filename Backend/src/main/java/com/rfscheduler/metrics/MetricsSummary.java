package com.rfscheduler.metrics;

public record MetricsSummary(
    long totalSteps,
    long totalTp,
    long totalFp,
    long totalTn,
    long totalFn,
    double pd,
    double pfa,
    double precision,
    double recall,
    double f1,
    double ait,
    double cumulativeReward,
    double scanEfficiency,
    double missRate,
    double interceptionRatio,
    double highPriorityDetectionRate,
    double coverage
) {}
