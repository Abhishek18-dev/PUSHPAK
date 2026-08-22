package com.rfscheduler.controller;

import com.rfscheduler.domain.ExperimentEntity;
import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.dto.ExperimentCreateRequest;
import com.rfscheduler.service.ExperimentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/experiments")
public class ExperimentController {

    private final ExperimentService experimentService;

    public ExperimentController(ExperimentService experimentService) {
        this.experimentService = experimentService;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @PostMapping
    public ResponseEntity<BaseResponse<Map<String, String>>> createExperiment(
            @Valid @RequestBody ExperimentCreateRequest request) {
        ExperimentEntity exp = experimentService.create(
                request.scenario(), request.policies(), request.name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(Map.of("id", exp.getId()), reqId()));
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> listExperiments() {
        List<Map<String, Object>> result = experimentService.list().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", e.getId());
                    m.put("scenario", e.getScenario());
                    m.put("status", e.getStatus());
                    m.put("created_at", e.getCreatedAt().toString());
                    return m;
                }).toList();
        return ResponseEntity.ok(BaseResponse.success(result, reqId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getExperiment(@PathVariable String id) {
        ExperimentEntity exp = experimentService.get(id);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", exp.getId());
        map.put("scenario", exp.getScenario());
        map.put("status", exp.getStatus());
        map.put("policies", exp.getPolicies());
        return ResponseEntity.ok(BaseResponse.success(map, reqId()));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<BaseResponse<Void>> runExperiment(@PathVariable String id) {
        experimentService.run(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<BaseResponse<Void>> stopExperiment(@PathVariable String id) {
        experimentService.stop(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getResults(@PathVariable String id) {
        Map<String, Object> results = experimentService.getResults(id);
        return ResponseEntity.ok(BaseResponse.success(results, reqId()));
    }
}
