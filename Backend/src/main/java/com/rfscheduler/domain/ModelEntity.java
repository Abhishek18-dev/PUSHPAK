package com.rfscheduler.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "models")
public class ModelEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String algorithm;

    @Column(nullable = false)
    private int version = 1;

    @Column(columnDefinition = "jsonb")
    private String hyperparams;

    @Column(nullable = false)
    private boolean active = false;

    @Column(name = "metrics_json", columnDefinition = "jsonb")
    private String metricsJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ModelEntity() {}

    public ModelEntity(String id, String algorithm) {
        this.id = id;
        this.algorithm = algorithm;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public String getHyperparams() { return hyperparams; }
    public void setHyperparams(String hyperparams) { this.hyperparams = hyperparams; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getMetricsJson() { return metricsJson; }
    public void setMetricsJson(String metricsJson) { this.metricsJson = metricsJson; }
    public Instant getCreatedAt() { return createdAt; }
}
