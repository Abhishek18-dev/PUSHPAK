package com.rfscheduler.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

@Entity
@Table(name = "scheduler_decisions")
public class SchedulerDecisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scan_event_id", nullable = false)
    private Long scanEventId;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "state_vector", columnDefinition = "jsonb")
    private String stateVector;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String action;

    @Column(nullable = false)
    private double reward = 0.0;

    @Column(name = "model_id")
    private String modelId;

    @Column(name = "decision_id")
    private String decisionId;

    public SchedulerDecisionEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getScanEventId() { return scanEventId; }
    public void setScanEventId(Long scanEventId) { this.scanEventId = scanEventId; }
    public String getStateVector() { return stateVector; }
    public void setStateVector(String stateVector) { this.stateVector = stateVector; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public double getReward() { return reward; }
    public void setReward(double reward) { this.reward = reward; }
    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }
    public String getDecisionId() { return decisionId; }
    public void setDecisionId(String decisionId) { this.decisionId = decisionId; }
}
