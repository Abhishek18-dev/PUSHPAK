package com.rfscheduler.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "detection_events")
public class DetectionEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scan_event_id", nullable = false)
    private Long scanEventId;

    @Column(nullable = false, length = 4)
    private String type;

    @Column(name = "latency_ms")
    private Long latencyMs;

    public DetectionEventEntity() {}

    public DetectionEventEntity(Long scanEventId, String type, Long latencyMs) {
        this.scanEventId = scanEventId;
        this.type = type;
        this.latencyMs = latencyMs;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getScanEventId() { return scanEventId; }
    public void setScanEventId(Long scanEventId) { this.scanEventId = scanEventId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
}
