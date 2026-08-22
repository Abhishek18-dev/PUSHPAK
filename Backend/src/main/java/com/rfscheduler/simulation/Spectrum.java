package com.rfscheduler.simulation;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Spectrum {
    private final List<FrequencyBand> bands = new ArrayList<>();
    private final List<Emitter> emitters = new ArrayList<>();
    private final List<Signal> activeSignals = new ArrayList<>();

    public void addBand(FrequencyBand band) {
        bands.add(band);
    }

    public void addEmitter(Emitter emitter) {
        emitters.add(emitter);
    }

    public void advance(SimulationClock clock) {
        clock.advance();
        long time = clock.getTime();
        activeSignals.clear();

        for (Emitter emitter : emitters) {
            Optional<Signal> signalOpt = emitter.behavior().generateSignal(time, emitter);
            signalOpt.ifPresent(activeSignals::add);
        }
    }

    public List<Signal> getActiveSignals() {
        return List.copyOf(activeSignals);
    }
    
    public List<FrequencyBand> getBands() {
        return List.copyOf(bands);
    }
    
    public List<Emitter> getEmitters() {
        return List.copyOf(emitters);
    }
}
