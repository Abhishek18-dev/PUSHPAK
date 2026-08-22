package com.rfscheduler.simulation;

import java.util.Optional;
import java.util.Random;

public class IntermittentBehavior implements EmitterBehavior {
    private final Random random;
    private final double turnOnProbability;
    private final double turnOffProbability;

    private boolean isTransmitting = false;
    private long currentStartTime = -1;

    public IntermittentBehavior(long seed, double turnOnProbability, double turnOffProbability) {
        this.random = new Random(seed);
        this.turnOnProbability = turnOnProbability;
        this.turnOffProbability = turnOffProbability;
    }

    @Override
    public Optional<Signal> generateSignal(long time, Emitter context) {
        if (isTransmitting) {
            if (random.nextDouble() < turnOffProbability) {
                isTransmitting = false;
            }
        } else {
            if (random.nextDouble() < turnOnProbability) {
                isTransmitting = true;
                currentStartTime = time;
            }
        }

        if (isTransmitting) {
            return Optional.of(new Signal(context.id(), context.primaryBandId(), currentStartTime));
        }
        return Optional.empty();
    }
}
