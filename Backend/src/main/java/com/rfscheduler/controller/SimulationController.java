package com.rfscheduler.controller;

import com.rfscheduler.domain.SimulationEntity;
import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.dto.SimulationCreateRequest;
import com.rfscheduler.dto.SimulationCreateResponse;
import com.rfscheduler.dto.SimulationUpdateRequest;
import com.rfscheduler.service.SimulationService;
import com.rfscheduler.util.AuditLogger;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/simulations")
public class SimulationController {

    private final SimulationService simulationService;
    private final AuditLogger auditLogger;

    public SimulationController(SimulationService simulationService, AuditLogger auditLogger) {
        this.simulationService = simulationService;
        this.auditLogger = auditLogger;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @PostMapping
    public ResponseEntity<BaseResponse<SimulationCreateResponse>> createSimulation(
            @Valid @RequestBody SimulationCreateRequest request) {
        SimulationEntity sim = simulationService.create(
                request.name(), request.bands(), request.durationSteps(), request.seed());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(new SimulationCreateResponse(sim.getId(), sim.getStatus()), reqId()));
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> listSimulations(
            @RequestParam(required = false) String status) {
        List<Map<String, Object>> result = simulationService.list(status).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(BaseResponse.success(result, reqId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getSimulation(@PathVariable String id) {
        return ResponseEntity.ok(BaseResponse.success(toMap(simulationService.get(id)), reqId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> updateSimulation(
            @PathVariable String id, @Valid @RequestBody SimulationUpdateRequest request) {
        
        Map<String, Object> updates = new HashMap<>();
        if (request.name() != null) updates.put("name", request.name());
        if (request.bands() != null) updates.put("bands", request.bands());
        if (request.durationSteps() != null) updates.put("duration_steps", request.durationSteps());
        if (request.seed() != null) updates.put("seed", request.seed());
        
        SimulationEntity sim = simulationService.update(id, updates);
        auditLogger.logConfigChange("Simulation", id, updates.toString(), "api_user");
        return ResponseEntity.ok(BaseResponse.success(toMap(sim), reqId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteSimulation(@PathVariable String id) {
        simulationService.delete(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<BaseResponse<Void>> startSimulation(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "baseline") String policy) {
        simulationService.start(id, policy);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<BaseResponse<Void>> stopSimulation(@PathVariable String id) {
        simulationService.stop(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<BaseResponse<Void>> resetSimulation(@PathVariable String id) {
        simulationService.reset(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    private Map<String, Object> toMap(SimulationEntity sim) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", sim.getId());
        map.put("name", sim.getName() != null ? sim.getName() : "Simulation " + sim.getId());
        map.put("status", sim.getStatus() != null ? sim.getStatus() : "draft");
        map.put("bands", sim.getBands());
        map.put("duration_steps", sim.getDurationSteps());
        map.put("seed", sim.getSeed());
        map.put("current_step", sim.getCurrentStep());
        map.put("created_at", sim.getCreatedAt() != null ? sim.getCreatedAt().toString() : java.time.Instant.now().toString());
        return map;
    }
}
