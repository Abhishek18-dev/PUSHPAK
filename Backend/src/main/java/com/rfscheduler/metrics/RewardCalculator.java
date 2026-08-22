package com.rfscheduler.metrics;

import com.rfscheduler.receiver.DetectionEvent;
import com.rfscheduler.receiver.DetectionType;
import com.rfscheduler.simulation.FrequencyBand;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public class RewardCalculator {
    private final RewardConfig config;

    public RewardCalculator(RewardConfig config) {
        this.config = config;
    }

    public double calculateReward(
        Optional<DetectionEvent> eventOpt, 
        int scannedBandId, 
        boolean wasRedundant,
        List<FrequencyBand> allBands, 
        Set<Integer> activeHighPriorityBandIds,
        long latencyMs
    ) {
        double d = 0;
        double p = 0;
        double l = 0;
        double f = 0;
        double c = wasRedundant ? 1.0 : 0.0;
        double m = 0;
        
        Optional<FrequencyBand> scannedBand = allBands.stream()
                .filter(b -> b.id() == scannedBandId)
                .findFirst();
                
        if (scannedBand.isPresent()) {
            p = scannedBand.get().priorityWeight();
        }

        if (eventOpt.isPresent()) {
            DetectionEvent event = eventOpt.get();
            if (event.type() == DetectionType.TP) {
                d = 1.0;
                l = latencyMs;
            } else if (event.type() == DetectionType.FP) {
                f = 1.0;
            }
        }
        
        long missedCount = activeHighPriorityBandIds.stream()
                .filter(id -> id != scannedBandId)
                .count();
        m = missedCount;

        return (config.w1() * d) 
             + (config.w2() * p * d)
             - (config.w3() * l)
             - (config.w4() * f)
             - (config.w5() * c)
             - (config.w6() * m);
    }
}
