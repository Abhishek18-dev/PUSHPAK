package com.rfscheduler.simulation;

import java.util.Optional;

public interface EmitterBehavior {
    Optional<Signal> generateSignal(long time, Emitter context);
}
