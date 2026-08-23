package com.rfscheduler.receiver;

import com.rfscheduler.simulation.Signal;
import java.util.List;

public record Observation(
    boolean valid, 
    List<Signal> signalsPresent, 
    int bandId
) {}
