package com.rfscheduler.scheduler;

import com.rfscheduler.receiver.DetectionType;
import com.rfscheduler.receiver.Receiver;
import com.rfscheduler.simulation.FrequencyBand;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * StateBuilder assembles the full StateVector (API_CONTRACT.md ML-001).
 * Merges simulation-side features with Ai-ml-2's periodicity predictions
 * before sending the state to Ai-ml-1's /internal/decide.
 *
 * StateVector shape:
 * {
 *   "bands": [
 *     {
 *       "band_id": 0,
 *       "time_since_last_scan": 12,
 *       "recent_detection_rate_ewma": 0.42,
 *       "consecutive_misses": 3,
 *       "periodicity_phase": 0.71,        // from Ai-ml-2
 *       "periodicity_confidence": 0.85,    // from Ai-ml-2
 *       "band_priority_weight": 1.0,
 *       "tuning_cost_to_band": 1
 *     }
 *   ],
 *   "receiver": { "tuned_bands": [2], "dwell_remaining_ms": 0, "tuning_delay_countdown_ms": 0 }
 * }
 */
@Component
public class StateBuilder {

    private final PeriodicityClient periodicityClient;

    // Per-simulation tracking state
    private final Map<String, Map<Integer, Long>> lastScanTime = new HashMap<>();
    private final Map<String, Map<Integer, Double>> detectionRateEwma = new HashMap<>();
    private final Map<String, Map<Integer, Integer>> consecutiveMisses = new HashMap<>();
    
    private static final double EWMA_ALPHA = 0.1;

    public StateBuilder(PeriodicityClient periodicityClient) {
        this.periodicityClient = periodicityClient;
    }

    /**
     * Build the full StateVector for a simulation at the current time step.
     */
    public Map<String, Object> buildState(String simulationId, long currentStep,
                                           List<FrequencyBand> bands, Receiver receiver,
                                           int currentTunedBand) {
        Map<Integer, Long> simLastScan = lastScanTime.computeIfAbsent(simulationId, k -> new HashMap<>());
        Map<Integer, Double> simEwma = detectionRateEwma.computeIfAbsent(simulationId, k -> new HashMap<>());
        Map<Integer, Integer> simMisses = consecutiveMisses.computeIfAbsent(simulationId, k -> new HashMap<>());

        List<Map<String, Object>> bandStates = new ArrayList<>();
        List<Integer> bandIds = bands.stream().map(FrequencyBand::id).toList();
        Map<Integer, PeriodicityClient.PeriodicityPrediction> predictions = 
                periodicityClient.predictBatch(simulationId, bandIds, (double) currentStep);

        for (FrequencyBand band : bands) {
            int bandId = band.id();

            // Time since last scan
            long timeSinceLastScan = currentStep - simLastScan.getOrDefault(bandId, 0L);

            // EWMA detection rate
            double ewma = simEwma.getOrDefault(bandId, 0.0);

            // Consecutive misses
            int misses = simMisses.getOrDefault(bandId, 0);

            // Get periodicity features from Ai-ml-2
            PeriodicityClient.PeriodicityPrediction prediction = 
                    predictions.getOrDefault(bandId, PeriodicityClient.PeriodicityPrediction.DEFAULT);

            // Tuning cost: how many bands away from current position
            int tuningCost = Math.abs(bandId - currentTunedBand);
            if (tuningCost == 0) tuningCost = 0; // Same band = no tuning cost

            Map<String, Object> bandState = new LinkedHashMap<>();
            bandState.put("band_id", bandId);
            bandState.put("time_since_last_scan", timeSinceLastScan);
            bandState.put("recent_detection_rate_ewma", ewma);
            bandState.put("consecutive_misses", misses);
            bandState.put("periodicity_phase", prediction.phase());
            bandState.put("periodicity_confidence", prediction.confidence());
            bandState.put("band_priority_weight", band.priorityWeight());
            bandState.put("tuning_cost_to_band", tuningCost);

            bandStates.add(bandState);
        }

        // Receiver state
        Map<String, Object> receiverState = new LinkedHashMap<>();
        receiverState.put("tuned_bands", receiver.getTunedBands());
        receiverState.put("dwell_remaining_ms", receiver.getDwellRemainingMs());
        receiverState.put("tuning_delay_countdown_ms", receiver.getTuningDelayCountdownMs());

        Map<String, Object> stateVector = new LinkedHashMap<>();
        stateVector.put("bands", bandStates);
        stateVector.put("receiver", receiverState);

        return stateVector;
    }

    /**
     * Update tracking state after a scan step.
     * Called by the simulation loop after each scan/detection.
     */
    public void update(String simulationId, long currentStep, int scannedBandId,
                        DetectionType detectionType) {
        // Update last scan time
        lastScanTime.computeIfAbsent(simulationId, k -> new HashMap<>())
                .put(scannedBandId, currentStep);

        // Update EWMA detection rate
        double detected = (detectionType == DetectionType.TP) ? 1.0 : 0.0;
        Map<Integer, Double> simEwma = detectionRateEwma.computeIfAbsent(simulationId, k -> new HashMap<>());
        double oldEwma = simEwma.getOrDefault(scannedBandId, 0.0);
        double newEwma = EWMA_ALPHA * detected + (1 - EWMA_ALPHA) * oldEwma;
        simEwma.put(scannedBandId, newEwma);

        // Update consecutive misses
        Map<Integer, Integer> simMisses = consecutiveMisses.computeIfAbsent(simulationId, k -> new HashMap<>());
        if (detectionType == DetectionType.TP) {
            simMisses.put(scannedBandId, 0);
        } else if (detectionType == DetectionType.FN) {
            simMisses.merge(scannedBandId, 1, Integer::sum);
        }
    }

    /**
     * Reset state for a simulation (on simulation reset).
     */
    public void resetSimulation(String simulationId) {
        lastScanTime.remove(simulationId);
        detectionRateEwma.remove(simulationId);
        consecutiveMisses.remove(simulationId);
        periodicityClient.reset(simulationId);
    }

    /**
     * Extract the internal tracking state for a simulation (used for checkpointing).
     */
    public Map<String, Object> getCheckpointState(String simulationId) {
        Map<String, Object> state = new HashMap<>();
        state.put("lastScanTime", lastScanTime.getOrDefault(simulationId, new HashMap<>()));
        state.put("detectionRateEwma", detectionRateEwma.getOrDefault(simulationId, new HashMap<>()));
        state.put("consecutiveMisses", consecutiveMisses.getOrDefault(simulationId, new HashMap<>()));
        return state;
    }

    /**
     * Load the internal tracking state from a checkpoint.
     */
    @SuppressWarnings("unchecked")
    public void loadCheckpointState(String simulationId, Map<String, Object> checkpoint) {
        if (checkpoint == null) return;
        
        if (checkpoint.containsKey("lastScanTime")) {
            Map<String, Number> map = (Map<String, Number>) checkpoint.get("lastScanTime");
            Map<Integer, Long> parsed = new HashMap<>();
            map.forEach((k, v) -> parsed.put(Integer.parseInt(k), v.longValue()));
            lastScanTime.put(simulationId, parsed);
        }
        
        if (checkpoint.containsKey("detectionRateEwma")) {
            Map<String, Number> map = (Map<String, Number>) checkpoint.get("detectionRateEwma");
            Map<Integer, Double> parsed = new HashMap<>();
            map.forEach((k, v) -> parsed.put(Integer.parseInt(k), v.doubleValue()));
            detectionRateEwma.put(simulationId, parsed);
        }
        
        if (checkpoint.containsKey("consecutiveMisses")) {
            Map<String, Number> map = (Map<String, Number>) checkpoint.get("consecutiveMisses");
            Map<Integer, Integer> parsed = new HashMap<>();
            map.forEach((k, v) -> parsed.put(Integer.parseInt(k), v.intValue()));
            consecutiveMisses.put(simulationId, parsed);
        }
    }
}
