package com.rfscheduler.simulation;

import java.util.List;
import java.util.Optional;
import java.util.Random;

public class AgileBehavior implements EmitterBehavior {
    private final Random random;
    private final List<Integer> availableBands;
    private final int hopPeriod;
    
    private int currentBand;

    public AgileBehavior(long seed, List<Integer> availableBands, int hopPeriod) {
        this.random = new Random(seed);
        this.availableBands = availableBands;
        this.hopPeriod = hopPeriod;
        this.currentBand = availableBands.get(random.nextInt(availableBands.size()));
    }

    @Override
    public Optional<Signal> generateSignal(long time, Emitter context) {
        if (time % hopPeriod == 0 && time > 0) {
            currentBand = availableBands.get(random.nextInt(availableBands.size()));
        }
        return Optional.of(new Signal(context.id(), currentBand, (time / hopPeriod) * hopPeriod));
    }
}
