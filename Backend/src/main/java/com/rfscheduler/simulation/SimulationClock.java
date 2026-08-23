package com.rfscheduler.simulation;

public class SimulationClock {
    private long currentStep = 0;

    public long getTime() {
        return currentStep;
    }

    public void advance() {
        currentStep++;
    }

    public void reset() {
        currentStep = 0;
    }
}
