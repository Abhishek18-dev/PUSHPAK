package com.rfscheduler.receiver;

import java.util.ArrayList;
import java.util.List;

public class Receiver {
    private List<Integer> tunedBands = new ArrayList<>();
    private int dwellRemainingMs = 0;
    private int tuningDelayCountdownMs = 0;

    public List<Integer> getTunedBands() {
        return tunedBands;
    }

    public void setTunedBands(List<Integer> tunedBands) {
        this.tunedBands = new ArrayList<>(tunedBands);
    }

    public int getDwellRemainingMs() {
        return dwellRemainingMs;
    }

    public void setDwellRemainingMs(int dwellRemainingMs) {
        this.dwellRemainingMs = dwellRemainingMs;
    }

    public int getTuningDelayCountdownMs() {
        return tuningDelayCountdownMs;
    }

    public void setTuningDelayCountdownMs(int tuningDelayCountdownMs) {
        this.tuningDelayCountdownMs = tuningDelayCountdownMs;
    }

    public void tick() {
        if (tuningDelayCountdownMs > 0) {
            tuningDelayCountdownMs--;
        } else if (dwellRemainingMs > 0) {
            dwellRemainingMs--;
        }
    }
}
