package com.rfscheduler.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "experiments")
public class ExperimentEntity {

    @Id
    private String id;

    private String name;

    @Column(nullable = false, length = 2)
    private String scenario;

    @Column(nullable = false, columnDefinition = "jsonb")
    private String policies = "[\"baseline\"]";

    @Column(nullable = false)
    private String status = "created";

    @Column(name = "config_json", columnDefinition = "jsonb")
    private String configJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ExperimentEntity() {}

    public ExperimentEntity(String id, String scenario, String policies) {
        this.id = id;
        this.scenario = scenario;
        this.policies = policies;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }
    public String getPolicies() { return policies; }
    public void setPolicies(String policies) { this.policies = policies; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public Instant getCreatedAt() { return createdAt; }
}
