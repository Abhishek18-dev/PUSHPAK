package com.rfscheduler.controller;

import com.rfscheduler.domain.EmitterEntity;
import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.dto.EmitterCreateRequest;
import com.rfscheduler.dto.EmitterUpdateRequest;
import com.rfscheduler.exception.ResourceNotFoundException;
import com.rfscheduler.repository.EmitterRepository;
import com.rfscheduler.util.AuditLogger;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/emitters")
public class EmitterController {

    private final EmitterRepository emitterRepo;
    private final AuditLogger auditLogger;

    public EmitterController(EmitterRepository emitterRepo, AuditLogger auditLogger) {
        this.emitterRepo = emitterRepo;
        this.auditLogger = auditLogger;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @PostMapping
    public ResponseEntity<BaseResponse<Map<String, Object>>> createEmitter(
            @Valid @RequestBody(required = false) EmitterCreateRequest request) {
        String id = "emit_" + UUID.randomUUID().toString().substring(0, 6);
        String simId = (request != null && request.simulationId() != null && !request.simulationId().isBlank())
                ? request.simulationId() : "sim_default";
        String behaviorClass = (request != null && request.behaviorClass() != null && !request.behaviorClass().isBlank())
                ? request.behaviorClass() : "fixed";
        int band = (request != null && request.band() != null) ? request.band() : 0;
        int period = (request != null && request.period() != null) ? request.period() : 10;
        double priority = (request != null && request.priority() != null && request.priority() > 0)
                ? request.priority() : 1.0;

        EmitterEntity emitter = new EmitterEntity(id, simId, behaviorClass, band, period, priority);
        emitterRepo.save(emitter);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(toMap(emitter), reqId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getEmitter(@PathVariable String id) {
        EmitterEntity emitter = emitterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emitter not found: " + id));
        return ResponseEntity.ok(BaseResponse.success(toMap(emitter), reqId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> updateEmitter(
            @PathVariable String id, @Valid @RequestBody EmitterUpdateRequest request) {
        EmitterEntity emitter = emitterRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emitter not found: " + id));
        
        if (request.behaviorClass() != null) emitter.setBehaviorClass(request.behaviorClass());
        if (request.band() != null) emitter.setBand(request.band());
        if (request.period() != null) emitter.setPeriod(request.period());
        if (request.priority() != null) emitter.setPriority(request.priority());
        
        emitterRepo.save(emitter);
        auditLogger.logConfigChange("Emitter", id, request.toString(), "api_user");
        return ResponseEntity.ok(BaseResponse.success(toMap(emitter), reqId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> deleteEmitter(@PathVariable String id) {
        emitterRepo.deleteById(id);
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    private Map<String, Object> toMap(EmitterEntity e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("simulation_id", e.getSimulationId());
        map.put("behavior_class", e.getBehaviorClass());
        map.put("band", e.getBand());
        map.put("period", e.getPeriod());
        map.put("priority", e.getPriority());
        return map;
    }
}
