package com.rfscheduler.simulation;

import java.util.Optional;

public class PeriodicBehavior implements EmitterBehavior {
    private final int dutyCycleOnSteps;

    public PeriodicBehavior(int dutyCycleOnSteps) {
        this.dutyCycleOnSteps = dutyCycleOnSteps;
    }

    @Override
    public Optional<Signal> generateSignal(long time, Emitter context) {
        if (context.period() <= 0) return Optional.empty();
        long phase = time % context.period();
        if (phase < dutyCycleOnSteps) {
            return Optional.of(new Signal(context.id(), context.primaryBandId(), time - phase));
        }
        return Optional.empty();
    }
}
