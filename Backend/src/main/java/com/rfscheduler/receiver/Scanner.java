package com.rfscheduler.receiver;

import com.rfscheduler.simulation.Signal;
import com.rfscheduler.simulation.Spectrum;

import java.util.List;
import java.util.stream.Collectors;

public class Scanner {
    private final ReceiverConfig config;

    public Scanner(ReceiverConfig config) {
        this.config = config;
    }

    public Observation execute(ScanAction action, Receiver receiver, Spectrum spectrum) {
        boolean bandChanged = !receiver.getTunedBands().contains(action.nextBandId());
        if (bandChanged) {
            receiver.setTunedBands(List.of(action.nextBandId()));
            receiver.setTuningDelayCountdownMs(config.tuningDelayMs());
        }
        
        receiver.setDwellRemainingMs(action.requestedDwellTimeMs().orElse(config.defaultDwellMs()));
        receiver.tick();
        
        List<Signal> activeSignals = spectrum.getActiveSignals().stream()
                .filter(s -> s.bandId() == action.nextBandId())
                .collect(Collectors.toList());
                
        return new Observation(true, activeSignals, action.nextBandId());
    }
}
