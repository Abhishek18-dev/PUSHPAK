package com.rfscheduler.scheduler;

import com.rfscheduler.config.MLServiceConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

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
            request.put("detection_timestamp", (double) detectionTimestamp);

            restTemplate.postForObject("/internal/periodicity/update", request, Map.class);
            log.debug("Periodicity update sent: sim={}, band={}, t={}", simulationId, bandId, detectionTimestamp);
        } catch (RestClientException e) {
            log.warn("Periodicity update failed for sim={}, band={}: {}", simulationId, bandId, e.getMessage());
        }
    }

    /**
     * GET /internal/periodicity/predict — get periodicity prediction for a single band.
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
                Map<String, Object> data = (response.containsKey("data") && response.get("data") instanceof Map)
                        ? (Map<String, Object>) response.get("data")
                        : response;

                return parsePredictionData(data);
            }
        } catch (RestClientException e) {
            log.warn("Periodicity predict failed for sim={}, band={}: {}", simulationId, bandId, e.getMessage());
        }

        return PeriodicityPrediction.DEFAULT;
    }

    /**
     * POST /internal/periodicity/predict/batch — get predictions for all bands in one call.
     */
    @SuppressWarnings("unchecked")
    public Map<Integer, PeriodicityPrediction> predictBatch(String simulationId, List<Integer> bandIds, Double now) {
        Map<Integer, PeriodicityPrediction> result = new HashMap<>();
        if (!config.getPeriodicity().isEnabled() || bandIds == null || bandIds.isEmpty()) {
            for (Integer bandId : bandIds) {
                result.put(bandId, PeriodicityPrediction.DEFAULT);
            }
            return result;
        }

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("simulation_id", simulationId);
            request.put("band_ids", bandIds);
            if (now != null) {
                request.put("now", now);
            }

            Map<String, Object> response = restTemplate.postForObject(
                    "/internal/periodicity/predict/batch", request, Map.class);

            if (response != null) {
                Map<String, Object> data = (response.containsKey("data") && response.get("data") instanceof Map)
                        ? (Map<String, Object>) response.get("data")
                        : response;

                if (data.containsKey("predictions") && data.get("predictions") instanceof List<?> list) {
                    for (Object item : list) {
                        if (item instanceof Map<?, ?> itemMap) {
                            Map<String, Object> map = (Map<String, Object>) itemMap;
                            int bId = ((Number) map.get("band_id")).intValue();
                            result.put(bId, parsePredictionData(map));
                        }
                    }
                }
            }
        } catch (RestClientException e) {
            log.warn("Periodicity batch predict failed for sim={}: {}", simulationId, e.getMessage());
        }

        // Fill in defaults for any missing bands
        for (Integer bandId : bandIds) {
            result.putIfAbsent(bandId, PeriodicityPrediction.DEFAULT);
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    private PeriodicityPrediction parsePredictionData(Map<String, Object> data) {
        double confidence = data.containsKey("confidence") && data.get("confidence") != null
                ? ((Number) data.get("confidence")).doubleValue() : 0.0;
        double estimatedPeriod = data.containsKey("estimated_period") && data.get("estimated_period") != null
                ? ((Number) data.get("estimated_period")).doubleValue() : 0.0;

        double phase = 0.0;
        if (data.containsKey("phase") && data.get("phase") != null) {
            phase = ((Number) data.get("phase")).doubleValue();
        } else if (data.containsKey("predicted_next_active_window") && data.get("predicted_next_active_window") instanceof Map) {
            Map<String, Object> window = (Map<String, Object>) data.get("predicted_next_active_window");
            if (window != null && window.containsKey("start") && window.get("start") != null && estimatedPeriod > 0) {
                double start = ((Number) window.get("start")).doubleValue();
                phase = (start % estimatedPeriod) / estimatedPeriod;
            }
        }

        return new PeriodicityPrediction(phase, confidence, estimatedPeriod);
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
            if (result != null) {
                if (result.containsKey("data") && result.get("data") instanceof Map) {
                    return (Map<String, Object>) result.get("data");
                }
                return result;
            }
            return Map.of();
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
            if (resp == null) return false;
            if ("ok".equals(resp.get("status"))) return true;
            if (resp.containsKey("data") && resp.get("data") instanceof Map<?, ?> dataMap) {
                return "ok".equals(dataMap.get("status"));
            }
            return false;
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
