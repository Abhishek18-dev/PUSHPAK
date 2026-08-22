package com.rfscheduler.simulation;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class GroundTruthGenerator {
    
    public record StepTruth(long time, List<Signal> signals) {}

    public List<StepTruth> generate(long durationSteps, List<Emitter> emitters) {
        List<StepTruth> truth = new ArrayList<>();
        
        for (long t = 1; t <= durationSteps; t++) {
            List<Signal> activeSignals = new ArrayList<>();
            for (Emitter emitter : emitters) {
                Optional<Signal> signalOpt = emitter.behavior().generateSignal(t, emitter);
                signalOpt.ifPresent(activeSignals::add);
            }
            truth.add(new StepTruth(t, activeSignals));
        }
        
        return truth;
    }
}
