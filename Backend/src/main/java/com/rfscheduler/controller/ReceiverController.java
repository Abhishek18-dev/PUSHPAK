package com.rfscheduler.controller;

import com.rfscheduler.dto.BaseResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/receiver")
public class ReceiverController {

    private String reqId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @GetMapping("/status")
    public ResponseEntity<BaseResponse<Map<String, Object>>> getStatus() {
        return ResponseEntity.ok(BaseResponse.success(Map.of("tuned_bands", List.of(1), "dwell_remaining_ms", 0), reqId()));
    }

    @PutMapping("/config")
    public ResponseEntity<BaseResponse<Void>> updateConfig(@RequestBody Map<String, Object> config) {
        return ResponseEntity.ok(BaseResponse.success(null, reqId()));
    }

    @PostMapping("/scan")
    public ResponseEntity<BaseResponse<Map<String, Object>>> manualScan(@RequestBody(required = false) Map<String, Object> request) {
        Object bandId = (request != null && request.containsKey("band_id") && request.get("band_id") != null)
                ? request.get("band_id") : 1;
        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("valid", true);
        resp.put("signals_present", List.of());
        resp.put("band_id", bandId);
        return ResponseEntity.ok(BaseResponse.success(resp, reqId()));
    }
}
