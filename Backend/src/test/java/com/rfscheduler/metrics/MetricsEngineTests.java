package com.rfscheduler.metrics;

import com.rfscheduler.receiver.DetectionEvent;
import com.rfscheduler.receiver.DetectionType;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MetricsEngineTests {

    @Test
    void testMetricsAggregation() {
        MetricsEngine engine = new MetricsEngine();
        engine.initialize(10, 5); // 10 bands, 5 emitters
        
        engine.recordStep(Optional.of(new DetectionEvent(DetectionType.TP, 1, Optional.empty())), 10.0, 10, 1, true);
        engine.recordStep(Optional.of(new DetectionEvent(DetectionType.FN, 1, Optional.empty())), -5.0, 0, 1, true);
        engine.recordStep(Optional.of(new DetectionEvent(DetectionType.FP, 1, Optional.empty())), -2.0, 0, 2, false);
        engine.recordStep(Optional.of(new DetectionEvent(DetectionType.TN, 1, Optional.empty())), 1.0, 0, 3, false);
        
        MetricsSummary summary = engine.getSummary();
        
        assertEquals(4, summary.totalSteps());
        assertEquals(1, summary.totalTp());
        assertEquals(1, summary.totalFn());
        assertEquals(1, summary.totalFp());
        assertEquals(1, summary.totalTn());
        
        assertEquals(0.5, summary.pd());
        assertEquals(0.5, summary.pfa());
        assertEquals(0.5, summary.precision());
        assertEquals(0.5, summary.recall());
        assertEquals(0.5, summary.f1());
        assertEquals(10.0, summary.ait());
        assertEquals(4.0, summary.cumulativeReward());
        assertEquals(0.5, summary.scanEfficiency());
        
        assertEquals(0.5, summary.highPriorityDetectionRate()); // 1 HP TP / (1 HP TP + 1 HP FN)
        assertEquals(0.3, summary.coverage()); // 3 unique bands (1, 2, 3) out of 10
    }
}
