package com.rfscheduler.metrics;

import com.rfscheduler.receiver.DetectionEvent;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public class MetricsEngine {
    private long totalSteps = 0;
    private long totalTp = 0;
    private long totalFp = 0;
    private long totalTn = 0;
    private long totalFn = 0;
    private long totalLatencyMs = 0;
    private double cumulativeReward = 0.0;
    
    private final Set<String> uniqueEmittersDetected = new HashSet<>();
    private final Set<Integer> uniqueBandsScanned = new HashSet<>();
    private long hpTp = 0;
    private long hpFn = 0;
    private int totalSpectrumBands = 16;
    private int totalEmittersPresent = 0;

    public void initialize(int totalSpectrumBands, int totalEmittersPresent) {
        this.totalSpectrumBands = totalSpectrumBands;
        this.totalEmittersPresent = totalEmittersPresent;
    }

    public void recordStep(Optional<DetectionEvent> eventOpt, double reward, long latencyMs, int scannedBandId, boolean isHighPriority) {
        recordStep(eventOpt, reward, latencyMs, scannedBandId, isHighPriority, 0L);
    }

    public void recordStep(Optional<DetectionEvent> eventOpt, double reward, long latencyMs, int scannedBandId, boolean isHighPriority, long unobservedActiveSignalsCount) {
        totalSteps++;
        cumulativeReward += reward;
        uniqueBandsScanned.add(scannedBandId);
        totalFn += unobservedActiveSignalsCount;
        
        if (eventOpt.isPresent()) {
            DetectionEvent event = eventOpt.get();
            switch (event.type()) {
                case TP -> {
                    totalTp++;
                    totalLatencyMs += latencyMs;
                    if (isHighPriority) hpTp++;
                    event.detectedSignal().ifPresent(s -> uniqueEmittersDetected.add(s.emitterId()));
                }
                case FP -> totalFp++;
                case TN -> totalTn++;
                case FN -> {
                    totalFn++;
                    if (isHighPriority) hpFn++;
                }
            }
        }
    }

    public MetricsSummary getSummary() {
        double pd = (totalTp + totalFn) > 0 ? (double) totalTp / (totalTp + totalFn) : 0.0;
        double pfa = (totalFp + totalTn) > 0 ? (double) totalFp / (totalFp + totalTn) : 0.0;
        double precision = (totalTp + totalFp) > 0 ? (double) totalTp / (totalTp + totalFp) : 0.0;
        double recall = pd;
        double f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0.0;
        double ait = totalTp > 0 ? (double) totalLatencyMs / totalTp : 0.0;
        double scanEfficiency = totalSteps > 0 ? (double) (totalTp + totalTn) / totalSteps : 0.0;
        double missRate = (totalTp + totalFn) > 0 ? (double) totalFn / (totalTp + totalFn) : 0.0;

        double interceptionRatio = totalEmittersPresent > 0 ? (double) uniqueEmittersDetected.size() / totalEmittersPresent : 0.0;
        double hpdr = (hpTp + hpFn) > 0 ? (double) hpTp / (hpTp + hpFn) : 0.0;
        double coverage = totalSpectrumBands > 0 ? (double) uniqueBandsScanned.size() / totalSpectrumBands : 0.0;

        return new MetricsSummary(
            totalSteps,
            totalTp,
            totalFp,
            totalTn,
            totalFn,
            pd,
            pfa,
            precision,
            recall,
            f1,
            ait,
            cumulativeReward,
            scanEfficiency,
            missRate,
            interceptionRatio,
            hpdr,
            coverage
        );
    }
}
