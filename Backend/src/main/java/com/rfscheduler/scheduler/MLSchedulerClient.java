package com.rfscheduler.scheduler;

import com.rfscheduler.config.MLServiceConfig;
import com.rfscheduler.receiver.ScanAction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * HTTP client for Ai-ml-1 Scheduler Engine (API_CONTRACT.md §4).
 * When ML is enabled, calls real endpoints on Ai-ml-1 (port 8500).
 * When disabled or service unreachable, falls back to mock/random behavior.
 */
@Service
public class MLSchedulerClient {

    private static final Logger log = LoggerFactory.getLogger(MLSchedulerClient.class);

    private final RestTemplate restTemplate;
    private final MLServiceConfig config;
    private final Random fallbackRandom = new Random();

    public MLSchedulerClient(@Qualifier("mlSchedulerRestTemplate") RestTemplate restTemplate,
                              MLServiceConfig config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    /**
     * POST /internal/decide — ask Ai-ml-1 for the next scan action.
     * Returns the action + model_id + decision_id.
     */
    @SuppressWarnings("unchecked")
    public DecideResponse decide(String simulationId, Map<String, Object> stateVector, 
                                  String policy, String modelId) {
        if (!config.getScheduler().isEnabled()) {
            log.debug("ML scheduler disabled — using fallback for sim={}", simulationId);
            return fallbackDecide(stateVector);
        }

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("simulation_id", simulationId);
            request.put("state", stateVector);
            request.put("policy", policy);
            if (modelId != null) {
                request.put("model_id", modelId);
            }

            Map<String, Object> response = restTemplate.postForObject(
                    "/internal/decide", request, Map.class);

            if (response != null) {
                Map<String, Object> action = (Map<String, Object>) response.get("action");
                int nextBand = ((Number) action.get("next_band")).intValue();
                Integer dwellTime = action.containsKey("dwell_time") 
                        ? ((Number) action.get("dwell_time")).intValue() : null;
                String respModelId = (String) response.get("model_id");
                String decisionId = (String) response.get("decision_id");
                
                log.info("ML decide: sim={}, band={}, dwell={}, model={}, decision={}", 
                        simulationId, nextBand, dwellTime, respModelId, decisionId);
                return new DecideResponse(
                        new ScanAction(nextBand, Optional.ofNullable(dwellTime)),
                        respModelId, decisionId);
            }
        } catch (RestClientException e) {
            log.warn("ML scheduler unreachable for sim={}: {} — falling back", 
                    simulationId, e.getMessage());
        }

        return fallbackDecide(stateVector);
    }

    /**
     * POST /internal/learn — send experience tuple to Ai-ml-1 for online learning.
     * No-op for baseline policy.
     */
    public void learn(String simulationId, String decisionId, 
                       Map<String, Object> state, Map<String, Object> action,
                       double reward, Map<String, Object> nextState) {
        if (!config.getScheduler().isEnabled()) {
            return;
        }

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("simulation_id", simulationId);
            request.put("decision_id", decisionId);
            request.put("state", state);
            request.put("action", action);
            request.put("reward", reward);
            request.put("next_state", nextState);

            restTemplate.postForObject("/internal/learn", request, Map.class);
            log.debug("ML learn sent: sim={}, decision={}, reward={}", simulationId, decisionId, reward);
        } catch (RestClientException e) {
            log.warn("ML learn failed for sim={}: {}", simulationId, e.getMessage());
        }
    }

    /**
     * POST /internal/train — launch async training job on Ai-ml-1.
     */
    @SuppressWarnings("unchecked")
    public String train(String algorithm, String scenario, Map<String, Object> hyperparams,
                         int episodeCount, int[] seedRange) {
        if (!config.getScheduler().isEnabled()) {
            return "job_mock_" + System.currentTimeMillis();
        }

        try {
            Map<String, Object> request = new LinkedHashMap<>();
            request.put("algorithm", algorithm);
            request.put("scenario", scenario);
            request.put("hyperparams", hyperparams != null ? hyperparams : Map.of());
            request.put("episode_count", episodeCount);
            request.put("seed_range", seedRange);

            Map<String, Object> response = restTemplate.postForObject(
                    "/internal/train", request, Map.class);
            if (response != null) {
                return (String) response.get("job_id");
            }
        } catch (RestClientException e) {
            log.warn("ML train failed: {}", e.getMessage());
        }
        return "job_mock_" + System.currentTimeMillis();
    }

    /**
     * GET /internal/train/{jobId}/status — check training job status.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrainingStatus(String jobId) {
        if (!config.getScheduler().isEnabled()) {
            return Map.of("status", "done", "progress", 1.0);
        }

        try {
            return restTemplate.getForObject("/internal/train/{jobId}/status", Map.class, jobId);
        } catch (RestClientException e) {
            log.warn("ML training status check failed for job={}: {}", jobId, e.getMessage());
            return Map.of("status", "unknown", "progress", 0.0);
        }
    }

    /**
     * GET /internal/models — list models from Ai-ml-1.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listModels(String algorithm, Boolean active) {
        if (!config.getScheduler().isEnabled()) {
            return List.of();
        }

        try {
            StringBuilder uri = new StringBuilder("/internal/models?");
            if (algorithm != null) uri.append("algorithm=").append(algorithm).append("&");
            if (active != null) uri.append("active=").append(active);
            
            List<Map<String, Object>> result = restTemplate.getForObject(
                    uri.toString(), List.class);
            return result != null ? result : List.of();
        } catch (RestClientException e) {
            log.warn("ML listModels failed: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * GET /internal/models/{id} — get model detail from Ai-ml-1.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getModel(String modelId) {
        if (!config.getScheduler().isEnabled()) {
            return Map.of("id", modelId, "status", "mock");
        }

        try {
            Map<String, Object> result = restTemplate.getForObject(
                    "/internal/models/{id}", Map.class, modelId);
            return result != null ? result : Map.of();
        } catch (RestClientException e) {
            log.warn("ML getModel failed for id={}: {}", modelId, e.getMessage());
            return Map.of("id", modelId, "error", e.getMessage());
        }
    }

    /**
     * POST /internal/models/{id}/activate — activate a model on Ai-ml-1.
     */
    public void activateModel(String modelId) {
        if (!config.getScheduler().isEnabled()) return;

        try {
            restTemplate.postForObject("/internal/models/{id}/activate", null, Map.class, modelId);
            log.info("ML model activated: {}", modelId);
        } catch (RestClientException e) {
            log.warn("ML activateModel failed for id={}: {}", modelId, e.getMessage());
        }
    }

    /**
     * POST /internal/models/{id}/evaluate — evaluate a model on Ai-ml-1.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluateModel(String modelId, String scenario, int episodeCount) {
        if (!config.getScheduler().isEnabled()) {
            return Map.of("pd", 0.0, "pfa", 0.0, "status", "mock");
        }

        try {
            Map<String, Object> request = Map.of("scenario", scenario, "episode_count", episodeCount);
            Map<String, Object> result = restTemplate.postForObject(
                    "/internal/models/{id}/evaluate", request, Map.class, modelId);
            return result != null ? result : Map.of();
        } catch (RestClientException e) {
            log.warn("ML evaluateModel failed for id={}: {}", modelId, e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * GET /internal/health — check Ai-ml-1 health.
     */
    public boolean isHealthy() {
        if (!config.getScheduler().isEnabled()) return false;
        try {
            Map<?, ?> resp = restTemplate.getForObject("/internal/health", Map.class);
            return resp != null && "ok".equals(resp.get("status"));
        } catch (RestClientException e) {
            return false;
        }
    }

    /**
     * Fallback decide when ML service is disabled/unreachable.
     * Picks a random band from the state vector.
     */
    @SuppressWarnings("unchecked")
    private DecideResponse fallbackDecide(Map<String, Object> stateVector) {
        int bandCount = 16;
        if (stateVector != null && stateVector.containsKey("bands")) {
            List<?> bands = (List<?>) stateVector.get("bands");
            if (!bands.isEmpty()) bandCount = bands.size();
        }
        int nextBand = fallbackRandom.nextInt(bandCount);
        return new DecideResponse(
                new ScanAction(nextBand, Optional.of(10)),
                null, "decision_mock_" + System.currentTimeMillis());
    }

    /**
     * Response from the /internal/decide endpoint.
     */
    public record DecideResponse(ScanAction action, String modelId, String decisionId) {}
}
