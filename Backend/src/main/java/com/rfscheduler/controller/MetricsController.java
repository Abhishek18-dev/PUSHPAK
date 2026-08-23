package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.service.SimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final SimulationService simulationService;

    public MetricsController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/live")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getLiveMetrics(
            @RequestParam(required = false) String simulationId) {
        Map<String, Object> metrics = simulationService.getLiveMetricsMap(simulationId);
        return ResponseEntity.ok(BaseResponse.success(metrics, reqId()));
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
