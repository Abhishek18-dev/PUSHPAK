package com.rfscheduler.simulation;

import java.util.List;
import java.util.Optional;
import java.util.Random;

public class RandomBehavior implements EmitterBehavior {
    private final Random random;
    private final List<Integer> availableBands;
    private final double transmissionProbability;

    public RandomBehavior(long seed, List<Integer> availableBands, double transmissionProbability) {
        this.random = new Random(seed);
        this.availableBands = availableBands;
        this.transmissionProbability = transmissionProbability;
    }

    @Override
    public Optional<Signal> generateSignal(long time, Emitter context) {
        if (random.nextDouble() < transmissionProbability) {
            int band = availableBands.get(random.nextInt(availableBands.size()));
            return Optional.of(new Signal(context.id(), band, time));
        }
        return Optional.empty();
    }
}
