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
        // Tune if different band
        if (!receiver.getTunedBands().contains(action.nextBandId())) {
            receiver.setTunedBands(List.of(action.nextBandId()));
            receiver.setTuningDelayCountdownMs(config.tuningDelayMs());
        }
        
        receiver.setDwellRemainingMs(action.requestedDwellTimeMs().orElse(config.defaultDwellMs()));

        // Receiver is blind if it still needs to tune
        boolean blind = receiver.getTuningDelayCountdownMs() > 0;
        
        // Advance hardware clock (consumes this simulation step)
        receiver.tick();
        
        if (blind) {
            return new Observation(false, List.of(), action.nextBandId());
        }
        
        List<Signal> activeSignals = spectrum.getActiveSignals().stream()
                .filter(s -> s.bandId() == action.nextBandId())
                .collect(Collectors.toList());
                
        return new Observation(true, activeSignals, action.nextBandId());
    }
}
