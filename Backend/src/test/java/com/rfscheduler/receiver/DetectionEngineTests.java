package com.rfscheduler.receiver;

import com.rfscheduler.simulation.Signal;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class DetectionEngineTests {

    @Test
    void testDetectionDeterminismAndProbabilities() {
        // High TP probability (1.0), zero FP probability (0.0) -> perfect detector
        DetectionEngine perfectEngine = new DetectionEngine(42L, 1.0, 0.0);
        
        // 1. Blind observation
        Observation blindObs = new Observation(false, List.of(), 1);
        assertTrue(perfectEngine.evaluate(blindObs).isEmpty());
        
        // 2. Empty observation -> TN
        Observation emptyObs = new Observation(true, List.of(), 1);
        Optional<DetectionEvent> eventTN = perfectEngine.evaluate(emptyObs);
        assertTrue(eventTN.isPresent());
        assertEquals(DetectionType.TN, eventTN.get().type());
        
        // 3. Signal present -> TP
        Observation signalObs = new Observation(true, List.of(new Signal("e1", 1, 0)), 1);
        Optional<DetectionEvent> eventTP = perfectEngine.evaluate(signalObs);
        assertTrue(eventTP.isPresent());
        assertEquals(DetectionType.TP, eventTP.get().type());
        
        // Zero TP probability (0.0), high FP probability (1.0) -> worst detector
        DetectionEngine worstEngine = new DetectionEngine(42L, 0.0, 1.0);
        
        // Empty -> FP
        Optional<DetectionEvent> eventFP = worstEngine.evaluate(emptyObs);
        assertTrue(eventFP.isPresent());
        assertEquals(DetectionType.FP, eventFP.get().type());
        
        // Signal present -> FN
        Optional<DetectionEvent> eventFN = worstEngine.evaluate(signalObs);
        assertTrue(eventFN.isPresent());
        assertEquals(DetectionType.FN, eventFN.get().type());
    }
}
