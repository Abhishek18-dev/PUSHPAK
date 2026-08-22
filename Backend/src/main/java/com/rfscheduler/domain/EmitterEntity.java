package com.rfscheduler.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import java.time.Instant;

@Entity
@Table(name = "emitters")
public class EmitterEntity {

    @Id
    private String id;

    @Column(name = "simulation_id", nullable = false)
    private String simulationId;

    @Column(name = "behavior_class", nullable = false)
    private String behaviorClass;

    @Column(nullable = false)
    private int band = 0;

    @Column(nullable = false)
    private int period = 10;

    @Column(nullable = false)
    private double priority = 1.0;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "config_json", columnDefinition = "jsonb")
    private String configJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public EmitterEntity() {}

    public EmitterEntity(String id, String simulationId, String behaviorClass, int band, int period, double priority) {
        this.id = id;
        this.simulationId = simulationId;
        this.behaviorClass = behaviorClass;
        this.band = band;
        this.period = period;
        this.priority = priority;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSimulationId() { return simulationId; }
    public void setSimulationId(String simulationId) { this.simulationId = simulationId; }
    public String getBehaviorClass() { return behaviorClass; }
    public void setBehaviorClass(String behaviorClass) { this.behaviorClass = behaviorClass; }
    public int getBand() { return band; }
    public void setBand(int band) { this.band = band; }
    public int getPeriod() { return period; }
    public void setPeriod(int period) { this.period = period; }
    public double getPriority() { return priority; }
    public void setPriority(double priority) { this.priority = priority; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public Instant getCreatedAt() { return createdAt; }
}
