package com.rfscheduler.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import java.time.Instant;

@Entity
@Table(name = "experiment_runs")
public class ExperimentRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "experiment_id", nullable = false)
    private String experimentId;

    @Column(name = "policy_type", nullable = false)
    private String policyType;

    @Column(name = "simulation_id")
    private String simulationId;

    @Column(nullable = false)
    private String status = "pending";

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "metrics_json", columnDefinition = "jsonb")
    private String metricsJson;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public ExperimentRunEntity() {}

    public ExperimentRunEntity(String experimentId, String policyType) {
        this.experimentId = experimentId;
        this.policyType = policyType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getExperimentId() { return experimentId; }
    public void setExperimentId(String experimentId) { this.experimentId = experimentId; }
    public String getPolicyType() { return policyType; }
    public void setPolicyType(String policyType) { this.policyType = policyType; }
    public String getSimulationId() { return simulationId; }
    public void setSimulationId(String simulationId) { this.simulationId = simulationId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMetricsJson() { return metricsJson; }
    public void setMetricsJson(String metricsJson) { this.metricsJson = metricsJson; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
