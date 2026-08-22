package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/live")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getLiveMetrics() {
        return ResponseEntity.ok(BaseResponse.success(Map.of("pd", 0.0), reqId()));
    }

    @GetMapping("/{experimentId}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getExperimentMetrics(@PathVariable String experimentId) {
        return ResponseEntity.ok(BaseResponse.success(Map.of("pd", 0.95), reqId()));
    }

    @GetMapping("/compare")
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> compareMetrics(@RequestParam List<String> ids) {
        return ResponseEntity.ok(BaseResponse.success(List.of(Map.of("id", ids.get(0))), reqId()));
    }
}
