package com.rfscheduler.receiver;

import com.rfscheduler.simulation.Signal;
import java.util.Optional;
import java.util.Random;

public class DetectionEngine {
    private final Random random;
    private final double truePositiveProbability;
    private final double falsePositiveProbability;

    public DetectionEngine(long seed, double truePositiveProbability, double falsePositiveProbability) {
        this.random = new Random(seed);
        this.truePositiveProbability = truePositiveProbability;
        this.falsePositiveProbability = falsePositiveProbability;
    }

    public Optional<DetectionEvent> evaluate(Observation obs) {
        if (!obs.valid()) {
            return Optional.empty(); // Receiver is blind
        }

        if (obs.signalsPresent().isEmpty()) {
            // No actual signal. Can be TN or FP.
            if (random.nextDouble() < falsePositiveProbability) {
                return Optional.of(new DetectionEvent(DetectionType.FP, obs.bandId(), Optional.empty()));
            } else {
                return Optional.of(new DetectionEvent(DetectionType.TN, obs.bandId(), Optional.empty()));
            }
        } else {
            // Signal(s) present. Can be TP or FN.
            if (random.nextDouble() < truePositiveProbability) {
                // Return the first detected signal
                return Optional.of(new DetectionEvent(DetectionType.TP, obs.bandId(), Optional.of(obs.signalsPresent().get(0))));
            } else {
                return Optional.of(new DetectionEvent(DetectionType.FN, obs.bandId(), Optional.empty()));
            }
        }
    }
}
