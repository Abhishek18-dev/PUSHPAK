package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.scheduler.PeriodicityClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/periodicity")
public class PeriodicityController {

    private final PeriodicityClient periodicityClient;

    public PeriodicityController(PeriodicityClient periodicityClient) {
        this.periodicityClient = periodicityClient;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/health")
    public ResponseEntity<BaseResponse<Map<String, Object>>> health() {
        boolean healthy = periodicityClient.isHealthy();
        Map<String, Object> data = Map.of(
                "service", "ml-periodicity",
                "healthy", healthy,
                "status", healthy ? "ok" : "unavailable"
        );
        return ResponseEntity.ok(BaseResponse.success(data, reqId()));
    }

    @GetMapping("/predict")
    public ResponseEntity<BaseResponse<Map<String, Object>>> predict(
            @RequestParam("simulation_id") String simulationId,
            @RequestParam("band_id") int bandId) {
        PeriodicityClient.PeriodicityPrediction pred = periodicityClient.predict(simulationId, bandId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("simulation_id", simulationId);
        data.put("band_id", bandId);
        data.put("phase", pred.phase());
        data.put("confidence", pred.confidence());
        data.put("estimated_period", pred.estimatedPeriod());
        return ResponseEntity.ok(BaseResponse.success(data, reqId()));
    }

    @PostMapping("/predict/batch")
    public ResponseEntity<BaseResponse<Map<String, Object>>> predictBatch(
            @RequestBody Map<String, Object> request) {
        String simulationId = (String) request.get("simulation_id");
        @SuppressWarnings("unchecked")
        List<Integer> bandIds = (List<Integer>) request.get("band_ids");
        Double now = request.containsKey("now") && request.get("now") != null
                ? ((Number) request.get("now")).doubleValue() : null;

        Map<Integer, PeriodicityClient.PeriodicityPrediction> preds =
                periodicityClient.predictBatch(simulationId, bandIds, now);

        List<Map<String, Object>> predictionsList = new ArrayList<>();
        for (Map.Entry<Integer, PeriodicityClient.PeriodicityPrediction> entry : preds.entrySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("band_id", entry.getKey());
            item.put("phase", entry.getValue().phase());
            item.put("confidence", entry.getValue().confidence());
            item.put("estimated_period", entry.getValue().estimatedPeriod());
            predictionsList.add(item);
        }

        Map<String, Object> data = Map.of("predictions", predictionsList);
        return ResponseEntity.ok(BaseResponse.success(data, reqId()));
    }

    @GetMapping("/state")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getState(
            @RequestParam("simulation_id") String simulationId,
            @RequestParam("band_id") int bandId) {
        Map<String, Object> state = periodicityClient.getState(simulationId, bandId);
        return ResponseEntity.ok(BaseResponse.success(state, reqId()));
    }

    @PostMapping("/reset")
    public ResponseEntity<BaseResponse<Map<String, Object>>> reset(
            @RequestBody Map<String, Object> request) {
        String simulationId = (String) request.get("simulation_id");
        if (simulationId != null) {
            periodicityClient.reset(simulationId);
        }
        return ResponseEntity.ok(BaseResponse.success(Map.of("acknowledged", true), reqId()));
    }
}
