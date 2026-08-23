package com.rfscheduler.receiver;

import com.rfscheduler.simulation.Signal;
import java.util.Optional;

public record DetectionEvent(DetectionType type, int bandId, Optional<Signal> detectedSignal) {
}
