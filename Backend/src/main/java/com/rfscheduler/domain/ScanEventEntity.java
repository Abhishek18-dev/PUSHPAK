package com.rfscheduler.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "scan_events")
public class ScanEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "simulation_id", nullable = false)
    private String simulationId;

    @Column(nullable = false)
    private long t;

    @Column(nullable = false)
    private int band;

    @Column(name = "policy_type", nullable = false)
    private String policyType = "baseline";

    @Column(name = "dwell_used", nullable = false)
    private int dwellUsed = 10;

    public ScanEventEntity() {}

    public ScanEventEntity(String simulationId, long t, int band, String policyType, int dwellUsed) {
        this.simulationId = simulationId;
        this.t = t;
        this.band = band;
        this.policyType = policyType;
        this.dwellUsed = dwellUsed;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSimulationId() { return simulationId; }
    public void setSimulationId(String simulationId) { this.simulationId = simulationId; }
    public long getT() { return t; }
    public void setT(long t) { this.t = t; }
    public int getBand() { return band; }
    public void setBand(int band) { this.band = band; }
    public String getPolicyType() { return policyType; }
    public void setPolicyType(String policyType) { this.policyType = policyType; }
    public int getDwellUsed() { return dwellUsed; }
    public void setDwellUsed(int dwellUsed) { this.dwellUsed = dwellUsed; }
}
