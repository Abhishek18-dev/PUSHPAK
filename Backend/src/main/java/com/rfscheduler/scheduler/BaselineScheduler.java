package com.rfscheduler.scheduler;

import com.rfscheduler.receiver.ScanAction;
import java.util.List;
import java.util.Optional;

public class BaselineScheduler implements Scheduler {
    private final List<Integer> bandsToScan;
    private final int defaultDwellMs;
    private int currentIndex = 0;

    public BaselineScheduler(List<Integer> bandsToScan, int defaultDwellMs) {
        this.bandsToScan = bandsToScan;
        this.defaultDwellMs = defaultDwellMs;
    }

    @Override
    public ScanAction decide() {
        if (bandsToScan.isEmpty()) {
            throw new IllegalStateException("No bands configured for BaselineScheduler");
        }
        
        int band = bandsToScan.get(currentIndex);
        currentIndex = (currentIndex + 1) % bandsToScan.size();
        
        return new ScanAction(band, Optional.of(defaultDwellMs));
    }
}
