package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/scheduler")
public class SchedulerController {

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/status")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getStatus() {
        return ResponseEntity.ok(BaseResponse.success(Map.of("policy", "baseline", "step_count", 0), reqId()));
    }

    @PutMapping("/config")
    public ResponseEntity<BaseResponse<Void>> updateConfig(@RequestBody Map<String, Object> config) {
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/start")
    public ResponseEntity<BaseResponse<Void>> startScheduler() {
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/stop")
    public ResponseEntity<BaseResponse<Void>> stopScheduler() {
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @GetMapping("/decision")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getDecision() {
        return ResponseEntity.ok(BaseResponse.success(Map.of("action", Map.of("next_band", 1)), reqId()));
    }

    @GetMapping("/history")
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> getHistory() {
        return ResponseEntity.ok(BaseResponse.success(List.of(), reqId()));
    }
}
