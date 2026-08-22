package com.rfscheduler.simulation;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class EmitterBehaviorTests {

    @Test
    void testFixedBehavior() {
        Emitter fixed = new Emitter("e1", BehaviorClass.FIXED, 10, 1.0, 0, new FixedBehavior());
        Optional<Signal> s1 = fixed.behavior().generateSignal(1, fixed);
        assertTrue(s1.isPresent());
        assertEquals(10, s1.get().bandId());
        assertEquals(1, s1.get().startTime());
    }

    @Test
    void testPeriodicBehavior() {
        Emitter periodic = new Emitter("e2", BehaviorClass.PERIODIC, 5, 1.0, 10, new PeriodicBehavior(2));
        
        // Time 1: 1 % 10 = 1 < 2 -> ON
        Optional<Signal> s1 = periodic.behavior().generateSignal(1, periodic);
        assertTrue(s1.isPresent());
        assertEquals(5, s1.get().bandId());
        assertEquals(0, s1.get().startTime()); // 1 - 1 = 0
        
        // Time 2: 2 % 10 = 2 < 2 -> OFF
        Optional<Signal> s2 = periodic.behavior().generateSignal(2, periodic);
        assertFalse(s2.isPresent());
    }

    @Test
    void testAgileBehaviorDeterminism() {
        List<Integer> bands = List.of(1, 2, 3, 4, 5);
        long seed = 42L;
        
        Emitter agile1 = new Emitter("e3", BehaviorClass.AGILE, 0, 1.0, 0, new AgileBehavior(seed, bands, 5));
        Emitter agile2 = new Emitter("e4", BehaviorClass.AGILE, 0, 1.0, 0, new AgileBehavior(seed, bands, 5));
        
        for (long t = 1; t <= 20; t++) {
            Optional<Signal> s1 = agile1.behavior().generateSignal(t, agile1);
            Optional<Signal> s2 = agile2.behavior().generateSignal(t, agile2);
            
            assertEquals(s1.isPresent(), s2.isPresent());
            if (s1.isPresent()) {
                assertEquals(s1.get().bandId(), s2.get().bandId(), "Bands should match for same seed");
            }
        }
    }

    @Test
    void testRandomBehaviorDeterminism() {
        List<Integer> bands = List.of(1, 2, 3);
        long seed = 100L;
        
        Emitter r1 = new Emitter("e5", BehaviorClass.RANDOM, 0, 1.0, 0, new RandomBehavior(seed, bands, 0.5));
        Emitter r2 = new Emitter("e6", BehaviorClass.RANDOM, 0, 1.0, 0, new RandomBehavior(seed, bands, 0.5));
        
        for (long t = 1; t <= 50; t++) {
            Optional<Signal> s1 = r1.behavior().generateSignal(t, r1);
            Optional<Signal> s2 = r2.behavior().generateSignal(t, r2);
            
            assertEquals(s1.isPresent(), s2.isPresent());
            if (s1.isPresent()) {
                assertEquals(s1.get().bandId(), s2.get().bandId());
            }
        }
    }

    @Test
    void testIntermittentBehaviorDeterminism() {
        long seed = 999L;
        Emitter i1 = new Emitter("e7", BehaviorClass.INTERMITTENT, 7, 1.0, 0, new IntermittentBehavior(seed, 0.3, 0.3));
        Emitter i2 = new Emitter("e8", BehaviorClass.INTERMITTENT, 7, 1.0, 0, new IntermittentBehavior(seed, 0.3, 0.3));
        
        for (long t = 1; t <= 50; t++) {
            Optional<Signal> s1 = i1.behavior().generateSignal(t, i1);
            Optional<Signal> s2 = i2.behavior().generateSignal(t, i2);
            
            assertEquals(s1.isPresent(), s2.isPresent());
        }
    }
}
