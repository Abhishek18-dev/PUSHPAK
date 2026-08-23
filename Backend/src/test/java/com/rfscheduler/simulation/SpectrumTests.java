package com.rfscheduler.simulation;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SpectrumTests {

    @Test
    void testSpectrumAdvance() {
        Spectrum spectrum = new Spectrum();
        spectrum.addBand(new FrequencyBand(1, 1.0));
        
        Emitter fixed = new Emitter("e1", BehaviorClass.FIXED, 1, 1.0, 0, new FixedBehavior());
        spectrum.addEmitter(fixed);
        
        SimulationClock clock = new SimulationClock();
        
        spectrum.advance(clock);
        assertEquals(1, clock.getTime());
        assertEquals(1, spectrum.getActiveSignals().size());
        assertEquals(1, spectrum.getActiveSignals().get(0).bandId());
        
        spectrum.advance(clock);
        assertEquals(2, clock.getTime());
        assertEquals(1, spectrum.getActiveSignals().size());
    }
}
