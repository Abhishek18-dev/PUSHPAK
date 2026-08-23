package com.rfscheduler.scheduler;

import com.rfscheduler.receiver.ScanAction;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BaselineSchedulerTests {

    @Test
    void testRoundRobinDeterminism() {
        BaselineScheduler scheduler = new BaselineScheduler(List.of(1, 2, 3), 10);
        
        ScanAction a1 = scheduler.decide();
        assertEquals(1, a1.nextBandId());
        
        ScanAction a2 = scheduler.decide();
        assertEquals(2, a2.nextBandId());
        
        ScanAction a3 = scheduler.decide();
        assertEquals(3, a3.nextBandId());
        
        ScanAction a4 = scheduler.decide();
        assertEquals(1, a4.nextBandId());
        assertEquals(10, a4.requestedDwellTimeMs().orElseThrow());
    }
}
