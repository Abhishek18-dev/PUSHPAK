package com.rfscheduler.simulation;

import java.util.Optional;

public class FixedBehavior implements EmitterBehavior {
    @Override
    public Optional<Signal> generateSignal(long time, Emitter context) {
        return Optional.of(new Signal(context.id(), context.primaryBandId(), time));
    }
}
