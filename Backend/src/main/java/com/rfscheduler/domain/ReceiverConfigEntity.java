package com.rfscheduler.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "receiver_configs")
public class ReceiverConfigEntity {

    @Id
    private String id;

    @Column(name = "simulation_id", nullable = false)
    private String simulationId;

    @Column(name = "bandwidth_k", nullable = false)
    private int bandwidthK = 1;

    @Column(name = "dwell_ms", nullable = false)
    private int dwellMs = 10;

    @Column(name = "tuning_delay", nullable = false)
    private int tuningDelay = 2;

    @Column(nullable = false)
    private double threshold = 0.5;

    public ReceiverConfigEntity() {}

    public ReceiverConfigEntity(String id, String simulationId) {
        this.id = id;
        this.simulationId = simulationId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSimulationId() { return simulationId; }
    public void setSimulationId(String simulationId) { this.simulationId = simulationId; }
    public int getBandwidthK() { return bandwidthK; }
    public void setBandwidthK(int bandwidthK) { this.bandwidthK = bandwidthK; }
    public int getDwellMs() { return dwellMs; }
    public void setDwellMs(int dwellMs) { this.dwellMs = dwellMs; }
    public int getTuningDelay() { return tuningDelay; }
    public void setTuningDelay(int tuningDelay) { this.tuningDelay = tuningDelay; }
    public double getThreshold() { return threshold; }
    public void setThreshold(double threshold) { this.threshold = threshold; }
}
