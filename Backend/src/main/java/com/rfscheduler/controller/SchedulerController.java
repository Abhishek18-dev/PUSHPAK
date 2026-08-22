package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/scheduler")
public class SchedulerController {

    private volatile String currentPolicy = "baseline";
    private volatile boolean isRunning = false;
    private final AtomicLong stepCount = new AtomicLong(0);

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/status")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getStatus() {
        return ResponseEntity.ok(BaseResponse.success(Map.of(
            "policy", currentPolicy,
            "running", isRunning,
            "step_count", stepCount.get()
        ), reqId()));
    }

    @PutMapping("/config")
    public ResponseEntity<BaseResponse<Map<String, Object>>> updateConfig(@RequestBody Map<String, Object> config) {
        if (config != null && config.containsKey("policy")) {
            this.currentPolicy = String.valueOf(config.get("policy"));
        }
        return ResponseEntity.ok(BaseResponse.success(Map.of("policy", currentPolicy), reqId()));
    }

    @PostMapping("/start")
    public ResponseEntity<BaseResponse<Void>> startScheduler() {
        this.isRunning = true;
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/stop")
    public ResponseEntity<BaseResponse<Void>> stopScheduler() {
        this.isRunning = false;
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @GetMapping("/decision")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getDecision() {
        return ResponseEntity.ok(BaseResponse.success(Map.of(
            "policy", currentPolicy,
            "action", Map.of("next_band", (int)(stepCount.incrementAndGet() % 16))
        ), reqId()));
    }

    @GetMapping("/history")
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> getHistory() {
        return ResponseEntity.ok(BaseResponse.success(List.of(), reqId()));
    }
}
