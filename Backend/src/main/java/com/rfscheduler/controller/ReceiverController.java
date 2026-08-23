package com.rfscheduler.controller;

import com.rfscheduler.domain.ReceiverConfigEntity;
import com.rfscheduler.domain.SimulationEntity;
import com.rfscheduler.dto.BaseResponse;
import com.rfscheduler.repository.ReceiverConfigRepository;
import com.rfscheduler.repository.SimulationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/receiver")
public class ReceiverController {

    private final ReceiverConfigRepository receiverConfigRepo;
    private final SimulationRepository simulationRepo;

    public ReceiverController(ReceiverConfigRepository receiverConfigRepo, SimulationRepository simulationRepo) {
        this.receiverConfigRepo = receiverConfigRepo;
        this.simulationRepo = simulationRepo;
    }

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/status")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getStatus(
            @RequestParam(required = false) String simulationId) {
        ReceiverConfigEntity rcfg = null;
        if (simulationId != null && !simulationId.isBlank()) {
            rcfg = receiverConfigRepo.findBySimulationId(simulationId).orElse(null);
        }
        if (rcfg == null) {
            List<ReceiverConfigEntity> all = receiverConfigRepo.findAll();
            rcfg = all.isEmpty() ? null : all.get(0);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("bandwidth_k", rcfg != null ? rcfg.getBandwidthK() : 2);
        resp.put("dwell_ms", rcfg != null ? rcfg.getDwellMs() : 10);
        resp.put("tuning_delay", rcfg != null ? rcfg.getTuningDelay() : 5);
        resp.put("threshold", rcfg != null ? rcfg.getThreshold() : 15.0);
        resp.put("tuned_bands", List.of(1));
        resp.put("dwell_remaining_ms", 0);

        return ResponseEntity.ok(BaseResponse.success(resp, reqId()));
    }

    @PutMapping("/config")
    public ResponseEntity<BaseResponse<Map<String, Object>>> updateConfig(@RequestBody Map<String, Object> config) {
        String simId = config.containsKey("simulation_id") && config.get("simulation_id") != null
                ? config.get("simulation_id").toString() : null;

        ReceiverConfigEntity rcfg = null;
        if (simId != null) {
            rcfg = receiverConfigRepo.findBySimulationId(simId).orElse(null);
        }
        if (rcfg == null) {
            List<ReceiverConfigEntity> all = receiverConfigRepo.findAll();
            if (!all.isEmpty()) {
                rcfg = all.get(0);
            } else {
                String targetSimId = simId != null ? simId : "sim_default";
                rcfg = new ReceiverConfigEntity("rcfg_" + UUID.randomUUID().toString().substring(0, 8), targetSimId);
            }
        }

        if (config.containsKey("bandwidth_k") && config.get("bandwidth_k") != null) {
            rcfg.setBandwidthK(((Number) config.get("bandwidth_k")).intValue());
        }
        if (config.containsKey("dwell_ms") && config.get("dwell_ms") != null) {
            rcfg.setDwellMs(((Number) config.get("dwell_ms")).intValue());
        }
        if (config.containsKey("tuning_delay") && config.get("tuning_delay") != null) {
            rcfg.setTuningDelay(((Number) config.get("tuning_delay")).intValue());
        }
        if (config.containsKey("threshold") && config.get("threshold") != null) {
            rcfg.setThreshold(((Number) config.get("threshold")).doubleValue());
        }

        receiverConfigRepo.save(rcfg);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("bandwidth_k", rcfg.getBandwidthK());
        resp.put("dwell_ms", rcfg.getDwellMs());
        resp.put("tuning_delay", rcfg.getTuningDelay());
        resp.put("threshold", rcfg.getThreshold());

        return ResponseEntity.ok(BaseResponse.success(resp, reqId()));
    }

    @PostMapping("/scan")
    public ResponseEntity<BaseResponse<Map<String, Object>>> manualScan(@RequestBody(required = false) Map<String, Object> request) {
        Object bandId = (request != null && request.containsKey("band_id") && request.get("band_id") != null)
                ? request.get("band_id") : 1;
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("valid", true);
        resp.put("signals_present", List.of());
        resp.put("band_id", bandId);
        return ResponseEntity.ok(BaseResponse.success(resp, reqId()));
    }
}
