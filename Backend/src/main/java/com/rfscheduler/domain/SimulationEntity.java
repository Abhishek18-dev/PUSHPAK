package com.rfscheduler.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import java.time.Instant;

@Entity
@Table(name = "simulations")
public class SimulationEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private long seed = 42;

    @Column(nullable = false)
    private int bands = 16;

    @Column(name = "duration_steps", nullable = false)
    private int durationSteps = 2000;

    @Column(nullable = false)
    private String status = "draft";

    @Column(name = "current_step", nullable = false)
    private long currentStep = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "checkpoint_data", columnDefinition = "jsonb")
    private String checkpointData;

    public SimulationEntity() {}

    public SimulationEntity(String id, String name, long seed, int bands, int durationSteps) {
        this.id = id;
        this.name = name;
        this.seed = seed;
        this.bands = bands;
        this.durationSteps = durationSteps;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getSeed() { return seed; }
    public void setSeed(long seed) { this.seed = seed; }

    public int getBands() { return bands; }
    public void setBands(int bands) { this.bands = bands; }

    public int getDurationSteps() { return durationSteps; }
    public void setDurationSteps(int durationSteps) { this.durationSteps = durationSteps; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; this.updatedAt = Instant.now(); }

    public long getCurrentStep() { return currentStep; }
    public void setCurrentStep(long currentStep) { this.currentStep = currentStep; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getCheckpointData() { return checkpointData; }
    public void setCheckpointData(String checkpointData) { this.checkpointData = checkpointData; }
}
