package com.rfscheduler.scheduler;

import com.rfscheduler.config.MLServiceConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HTTP client for Ai-ml-2 Periodicity Estimator (API_CONTRACT.md §5).
 * When ML is enabled, calls real endpoints on Ai-ml-2 (port 8600).
 * When disabled or unreachable, returns default/mock estimates.
 */
@Service
public class PeriodicityClient {

    private static final Logger log = LoggerFactory.getLogger(PeriodicityClient.class);

    private final RestTemplate restTemplate;
    private final MLServiceConfig config;

    public PeriodicityClient(@Qualifier("mlPeriodicityRestTemplate") RestTemplate restTemplate,
                              MLServiceConfig config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    /**
     * POST /internal/periodicity/update — notify Ai-ml-2 of a detection event.
     * Called by Backend on every confirmed detection event.
     */
    public void update(String simulationId, int bandId, long detectionTimestamp) {
        if (!config.getPeriodicity().isEnabled()) return;

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("simulation_id", simulationId);
            request.put("band_id", bandId);
            request.put("detection_timestamp", detectionTimestamp);

            restTemplate.postForObject("/internal/periodicity/update", request, Map.class);
            log.debug("Periodicity update sent: sim={}, band={}, t={}", simulationId, bandId, detectionTimestamp);
        } catch (RestClientException e) {
            log.warn("Periodicity update failed for sim={}, band={}: {}", simulationId, bandId, e.getMessage());
        }
    }

    /**
     * GET /internal/periodicity/predict — get periodicity prediction for a band.
     * Returns phase and confidence values to merge into StateVector.
     */
    @SuppressWarnings("unchecked")
    public PeriodicityPrediction predict(String simulationId, int bandId) {
        if (!config.getPeriodicity().isEnabled()) {
            return PeriodicityPrediction.DEFAULT;
        }

        try {
            String uri = String.format("/internal/periodicity/predict?simulation_id=%s&band_id=%d",
                    simulationId, bandId);
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            if (response != null) {
                double confidence = response.containsKey("confidence") 
                        ? ((Number) response.get("confidence")).doubleValue() : 0.0;
                double estimatedPeriod = response.containsKey("estimated_period")
                        ? ((Number) response.get("estimated_period")).doubleValue() : 0.0;
                
                // Derive phase from predicted window if available
                double phase = 0.0;
                if (response.containsKey("predicted_next_active_window")) {
                    Map<String, Object> window = (Map<String, Object>) response.get("predicted_next_active_window");
                    if (window != null && window.containsKey("start") && estimatedPeriod > 0) {
                        double start = ((Number) window.get("start")).doubleValue();
                        phase = (start % estimatedPeriod) / estimatedPeriod;
                    }
                }

                return new PeriodicityPrediction(phase, confidence, estimatedPeriod);
            }
        } catch (RestClientException e) {
            log.warn("Periodicity predict failed for sim={}, band={}: {}", simulationId, bandId, e.getMessage());
        }

        return PeriodicityPrediction.DEFAULT;
    }

    /**
     * GET /internal/periodicity/state — get raw estimator state for debugging.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getState(String simulationId, int bandId) {
        if (!config.getPeriodicity().isEnabled()) {
            return Map.of("status", "disabled");
        }

        try {
            String uri = String.format("/internal/periodicity/state?simulation_id=%s&band_id=%d",
                    simulationId, bandId);
            Map<String, Object> result = restTemplate.getForObject(uri, Map.class);
            return result != null ? result : Map.of();
        } catch (RestClientException e) {
            log.warn("Periodicity getState failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * POST /internal/periodicity/reset — clear estimator state for a simulation.
     */
    public void reset(String simulationId) {
        if (!config.getPeriodicity().isEnabled()) return;

        try {
            Map<String, Object> request = Map.of("simulation_id", simulationId);
            restTemplate.postForObject("/internal/periodicity/reset", request, Map.class);
            log.info("Periodicity estimator reset for sim={}", simulationId);
        } catch (RestClientException e) {
            log.warn("Periodicity reset failed for sim={}: {}", simulationId, e.getMessage());
        }
    }

    /**
     * GET /internal/health — check Ai-ml-2 health.
     */
    public boolean isHealthy() {
        if (!config.getPeriodicity().isEnabled()) return false;
        try {
            Map<?, ?> resp = restTemplate.getForObject("/internal/health", Map.class);
            return resp != null && "ok".equals(resp.get("status"));
        } catch (RestClientException e) {
            return false;
        }
    }

    /**
     * Periodicity prediction result.
     */
    public record PeriodicityPrediction(double phase, double confidence, double estimatedPeriod) {
        public static final PeriodicityPrediction DEFAULT = new PeriodicityPrediction(0.0, 0.0, 0.0);
    }
}
