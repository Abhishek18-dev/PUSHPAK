package com.rfscheduler.metrics;

import com.rfscheduler.receiver.DetectionEvent;
import com.rfscheduler.receiver.DetectionType;
import com.rfscheduler.simulation.FrequencyBand;
import com.rfscheduler.simulation.Signal;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RewardCalculatorTests {

    @Test
    void testRewardCalculation() {
        RewardConfig config = new RewardConfig(10.0, 5.0, 1.0, 2.0, 1.0, 3.0);
        RewardCalculator calculator = new RewardCalculator(config);
        
        List<FrequencyBand> allBands = List.of(
            new FrequencyBand(1, 1.0),
            new FrequencyBand(2, 2.0) 
        );
        
        DetectionEvent tpEvent = new DetectionEvent(DetectionType.TP, 2, Optional.of(new Signal("e1", 2, 0)));
        double r1 = calculator.calculateReward(Optional.of(tpEvent), 2, false, allBands, Set.of(), 2);
        assertEquals(18.0, r1);
        
        DetectionEvent fpEvent = new DetectionEvent(DetectionType.FP, 1, Optional.empty());
        double r2 = calculator.calculateReward(Optional.of(fpEvent), 1, false, allBands, Set.of(), 0);
        assertEquals(-2.0, r2);
        
        DetectionEvent tnEvent = new DetectionEvent(DetectionType.TN, 1, Optional.empty());
        double r3 = calculator.calculateReward(Optional.of(tnEvent), 1, true, allBands, Set.of(2), 0);
        assertEquals(-4.0, r3);
    }
}
