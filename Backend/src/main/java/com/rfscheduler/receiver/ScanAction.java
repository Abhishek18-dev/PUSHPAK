package com.rfscheduler.receiver;

import java.util.Optional;

public record ScanAction(int nextBandId, Optional<Integer> requestedDwellTimeMs) {
}
