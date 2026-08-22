package com.rfscheduler.controller;

import com.rfscheduler.domain.ModelEntity;
import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.dto.ModelEvaluateRequest;
import com.rfscheduler.dto.ModelTrainRequest;
import com.rfscheduler.repository.ModelRepository;
import com.rfscheduler.scheduler.MLSchedulerClient;
import com.rfscheduler.util.AuditLogger;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Model registry endpoints — proxy to Ai-ml-1's /internal/models/* endpoints.
 * Also maintains a local model registry in the database for tracking.
 */
@RestController
@RequestMapping("/api/v1/models")
public class ModelController {

    private final MLSchedulerClient mlClient;
    private final ModelRepository modelRepo;
    private final AuditLogger auditLogger;

    public ModelController(MLSchedulerClient mlClient, ModelRepository modelRepo, AuditLogger auditLogger) {
        this.mlClient = mlClient;
        this.modelRepo = modelRepo;
        this.auditLogger = auditLogger;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @PostMapping("/train")
    public ResponseEntity<BaseResponse<Map<String, String>>> trainModel(
            @Valid @RequestBody ModelTrainRequest request) {

        String jobId = mlClient.train(request.algorithm(), request.scenario(), 
                request.hyperparams(), request.episodeCount(), new int[]{1, 20});
        return ResponseEntity.ok(BaseResponse.success(Map.of("job_id", jobId), reqId()));
    }

    @GetMapping("/train/{jobId}/status")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getTrainingStatus(@PathVariable String jobId) {
        Map<String, Object> status = mlClient.getTrainingStatus(jobId);
        return ResponseEntity.ok(BaseResponse.success(status, reqId()));
    }

    @GetMapping
    public ResponseEntity<BaseResponse<List<Map<String, Object>>>> listModels(
            @RequestParam(required = false) String algorithm,
            @RequestParam(required = false) Boolean active) {
        // Try ML service first, fall back to local DB
        List<Map<String, Object>> models = mlClient.listModels(algorithm, active);
        if (models.isEmpty()) {
            // Return from local DB
            List<ModelEntity> entities;
            if (algorithm != null && active != null) {
                entities = modelRepo.findByAlgorithmAndActive(algorithm, active);
            } else if (algorithm != null) {
                entities = modelRepo.findByAlgorithm(algorithm);
            } else if (active != null) {
                entities = modelRepo.findByActive(active);
            } else {
                entities = modelRepo.findAll();
            }
            models = entities.stream().map(this::toMap).toList();
        }
        return ResponseEntity.ok(BaseResponse.success(models, reqId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getModel(@PathVariable String id) {
        Map<String, Object> model = mlClient.getModel(id);
        return ResponseEntity.ok(BaseResponse.success(model, reqId()));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<BaseResponse<Void>> activateModel(@PathVariable String id) {
        mlClient.activateModel(id);

        // Also update local DB
        modelRepo.findById(id).ifPresent(m -> {
            // Deactivate other models of same algorithm
            modelRepo.findByAlgorithmAndActiveTrue(m.getAlgorithm()).ifPresent(prev -> {
                prev.setActive(false);
                modelRepo.save(prev);
            });
            m.setActive(true);
            modelRepo.save(m);
            
            auditLogger.logActivation(id, "api_user");
        });

        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<BaseResponse<Map<String, Object>>> evaluateModel(
            @PathVariable String id, @Valid @RequestBody ModelEvaluateRequest request) {
        Map<String, Object> result = mlClient.evaluateModel(id, request.scenario(), request.episodeCount());
        return ResponseEntity.ok(BaseResponse.success(result, reqId()));
    }

    private Map<String, Object> toMap(ModelEntity m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("algorithm", m.getAlgorithm());
        map.put("version", m.getVersion());
        map.put("active", m.isActive());
        map.put("created_at", m.getCreatedAt().toString());
        return map;
    }
}
