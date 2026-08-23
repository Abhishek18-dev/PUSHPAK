package com.rfscheduler.simulation;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GroundTruthGeneratorTests {

    @Test
    void testGroundTruthDeterminism() {
        long seed = 12345L;
        List<Integer> bands = List.of(1, 2, 3, 4, 5);

        // Run 1
        List<Emitter> run1Emitters = List.of(
            new Emitter("e1", BehaviorClass.AGILE, 0, 1.0, 0, new AgileBehavior(seed, bands, 5)),
            new Emitter("e2", BehaviorClass.RANDOM, 0, 1.0, 0, new RandomBehavior(seed + 1, bands, 0.3))
        );
        GroundTruthGenerator generator1 = new GroundTruthGenerator();
        List<GroundTruthGenerator.StepTruth> truth1 = generator1.generate(100, run1Emitters);

        // Run 2
        List<Emitter> run2Emitters = List.of(
            new Emitter("e1", BehaviorClass.AGILE, 0, 1.0, 0, new AgileBehavior(seed, bands, 5)),
            new Emitter("e2", BehaviorClass.RANDOM, 0, 1.0, 0, new RandomBehavior(seed + 1, bands, 0.3))
        );
        GroundTruthGenerator generator2 = new GroundTruthGenerator();
        List<GroundTruthGenerator.StepTruth> truth2 = generator2.generate(100, run2Emitters);

        assertEquals(truth1.size(), truth2.size());
        
        for (int i = 0; i < truth1.size(); i++) {
            assertEquals(truth1.get(i).time(), truth2.get(i).time());
            assertEquals(truth1.get(i).signals().size(), truth2.get(i).signals().size());
            
            for (int j = 0; j < truth1.get(i).signals().size(); j++) {
                Signal s1 = truth1.get(i).signals().get(j);
                Signal s2 = truth2.get(i).signals().get(j);
                assertEquals(s1.bandId(), s2.bandId());
                assertEquals(s1.startTime(), s2.startTime());
                assertEquals(s1.emitterId(), s2.emitterId());
            }
        }
    }
}
