package com.rfscheduler.receiver;

import com.rfscheduler.simulation.BehaviorClass;
import com.rfscheduler.simulation.Emitter;
import com.rfscheduler.simulation.FixedBehavior;
import com.rfscheduler.simulation.FrequencyBand;
import com.rfscheduler.simulation.SimulationClock;
import com.rfscheduler.simulation.Spectrum;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ScannerTests {

    @Test
    void testTuningDelayMechanics() {
        ReceiverConfig config = new ReceiverConfig(1, 10, 2, 10.0); // 2 steps tuning delay
        Scanner scanner = new Scanner(config);
        Receiver receiver = new Receiver();
        
        Spectrum spectrum = new Spectrum();
        spectrum.addBand(new FrequencyBand(5, 1.0));
        spectrum.addEmitter(new Emitter("e1", BehaviorClass.FIXED, 5, 1.0, 0, new FixedBehavior()));
        
        SimulationClock clock = new SimulationClock();
        
        // Step 1: Tune to band 5. Tuning delay is 2 steps (Step 1 and Step 2 will be blind)
        spectrum.advance(clock);
        Observation obs1 = scanner.execute(new ScanAction(5, Optional.empty()), receiver, spectrum);
        assertFalse(obs1.valid(), "Should be blind during step 1 of tuning");
        assertEquals(1, receiver.getTuningDelayCountdownMs(), "1 tick consumed");
        
        // Step 2: Still tuning
        spectrum.advance(clock);
        Observation obs2 = scanner.execute(new ScanAction(5, Optional.empty()), receiver, spectrum);
        assertFalse(obs2.valid(), "Should be blind during step 2 of tuning");
        assertEquals(0, receiver.getTuningDelayCountdownMs(), "Tuning should be complete after tick");

        // Step 3: Tuning finished, should get valid observation
        spectrum.advance(clock);
        Observation obs3 = scanner.execute(new ScanAction(5, Optional.empty()), receiver, spectrum);
        assertTrue(obs3.valid(), "Should yield valid observation");
        assertEquals(1, obs3.signalsPresent().size());
        assertEquals(5, obs3.signalsPresent().get(0).bandId());
        
        // Step 4: Switch to band 6 (not in spectrum but tests the delay reset)
        spectrum.advance(clock);
        Observation obs4 = scanner.execute(new ScanAction(6, Optional.empty()), receiver, spectrum);
        assertFalse(obs4.valid(), "Switching to new band should incur delay again");
    }
}
