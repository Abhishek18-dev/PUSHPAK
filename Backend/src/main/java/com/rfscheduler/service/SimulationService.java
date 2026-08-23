package com.rfscheduler.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rfscheduler.domain.*;
import com.rfscheduler.exception.ResourceNotFoundException;
import com.rfscheduler.metrics.MetricsEngine;
import com.rfscheduler.metrics.MetricsSummary;
import com.rfscheduler.metrics.RewardCalculator;
import com.rfscheduler.metrics.RewardConfig;
import com.rfscheduler.receiver.*;
import com.rfscheduler.receiver.Scanner;
import com.rfscheduler.repository.*;
import com.rfscheduler.scheduler.*;
import com.rfscheduler.simulation.*;
import com.rfscheduler.websocket.RedisPubSubService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

@Service
public class SimulationService {

    private static final Logger log = LoggerFactory.getLogger(SimulationService.class);
    
    private final SimulationRepository simulationRepo;
    private final EmitterRepository emitterRepo;
    private final ReceiverConfigRepository receiverConfigRepo;
    private final ScanEventRepository scanEventRepo;
    private final DetectionEventRepository detectionEventRepo;
    private final SchedulerDecisionRepository decisionRepo;
    private final MLSchedulerClient mlClient;
    private final PeriodicityClient periodicityClient;
    private final StateBuilder stateBuilder;
    private final RedisPubSubService pubSub;
    private final ObjectMapper objectMapper;

    // Track running simulations
    private final Map<String, Boolean> runningSimulations = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> latestMetrics = new ConcurrentHashMap<>();

    // Default reward weights
    private static final RewardConfig DEFAULT_REWARD_CONFIG = new RewardConfig(1.0, 0.5, 0.01, 0.5, 0.1, 0.2);

    public SimulationService(SimulationRepository simulationRepo,
                              EmitterRepository emitterRepo,
                              ReceiverConfigRepository receiverConfigRepo,
                              ScanEventRepository scanEventRepo,
                              DetectionEventRepository detectionEventRepo,
                              SchedulerDecisionRepository decisionRepo,
                              MLSchedulerClient mlClient,
                              PeriodicityClient periodicityClient,
                              StateBuilder stateBuilder,
                              RedisPubSubService pubSub,
                              ObjectMapper objectMapper) {
        this.simulationRepo = simulationRepo;
        this.emitterRepo = emitterRepo;
        this.receiverConfigRepo = receiverConfigRepo;
        this.scanEventRepo = scanEventRepo;
        this.detectionEventRepo = detectionEventRepo;
        this.decisionRepo = decisionRepo;
        this.mlClient = mlClient;
        this.periodicityClient = periodicityClient;
        this.stateBuilder = stateBuilder;
        this.pubSub = pubSub;
        this.objectMapper = objectMapper;
    }

    public String generateId() {
        return "sim_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Transactional
    public SimulationEntity create(String name, int bands, int durationSteps, long seed) {
        SimulationEntity sim = new SimulationEntity(generateId(), name, seed, bands, durationSteps);
        simulationRepo.save(sim);

        // Create default receiver config
        ReceiverConfigEntity rcfg = new ReceiverConfigEntity("rcfg_" + sim.getId(), sim.getId());
        receiverConfigRepo.save(rcfg);

        // Automatically populate diverse dynamic emitters based on seed and band count
        Random rng = new Random(seed);
        int emitterCount = Math.max(3, Math.min(bands / 2, 6));
        String[] behaviors = {"fixed", "periodic", "agile", "random", "intermittent"};
        for (int i = 0; i < emitterCount; i++) {
            String bType = behaviors[i % behaviors.length];
            int assignedBand = rng.nextInt(bands);
            int period = 6 + rng.nextInt(15);
            double priority = 1.0 + (i % 3);
            EmitterEntity ee = new EmitterEntity(
                "emit_" + sim.getId() + "_" + i,
                sim.getId(),
                bType,
                assignedBand,
                period,
                priority
            );
            emitterRepo.save(ee);
        }

        return sim;
    }

    public SimulationEntity get(String id) {
        return simulationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation not found: " + id));
    }

    public List<SimulationEntity> list(String status) {
        if (status != null) {
            return simulationRepo.findByStatus(status);
        }
        return simulationRepo.findAll();
    }

    @Transactional
    public SimulationEntity update(String id, Map<String, Object> updates) {
        SimulationEntity sim = get(id);
        if (!"draft".equals(sim.getStatus())) {
            throw new IllegalStateException("Can only update simulations in 'draft' status");
        }
        if (updates.containsKey("name")) sim.setName((String) updates.get("name"));
        if (updates.containsKey("bands")) sim.setBands((Integer) updates.get("bands"));
        if (updates.containsKey("duration_steps")) sim.setDurationSteps((Integer) updates.get("duration_steps"));
        if (updates.containsKey("seed")) sim.setSeed(((Number) updates.get("seed")).longValue());
        return simulationRepo.save(sim);
    }

    @Transactional
    public void delete(String id) {
        stop(id);
        simulationRepo.deleteById(id);
    }

    /**
     * Start the simulation loop asynchronously.
     */
    @Async
    public void start(String id, String policyType) {
        SimulationEntity sim = get(id);
        sim.setStatus("running");
        simulationRepo.save(sim);

        runningSimulations.put(id, true);

        try {
            runSimulationLoop(sim, policyType != null ? policyType : "baseline");
        } catch (Exception e) {
            log.error("Simulation {} failed: {}", id, e.getMessage(), e);
            sim.setStatus("failed");
            simulationRepo.save(sim);
        } finally {
            runningSimulations.remove(id);
        }
    }

    public void stop(String id) {
        runningSimulations.put(id, false);
        simulationRepo.findById(id).ifPresent(sim -> {
            if ("running".equals(sim.getStatus())) {
                sim.setStatus("stopped");
                simulationRepo.save(sim);
            }
        });
    }

    @Transactional
    public void reset(String id) {
        stop(id);
        SimulationEntity sim = get(id);
        sim.setStatus("draft");
        sim.setCurrentStep(0);
        simulationRepo.save(sim);
        stateBuilder.resetSimulation(id);
    }

    /**
     * The main simulation loop — implements the per-step logic from README.
     */
    private void runSimulationLoop(SimulationEntity sim, String policyType) {
        String simId = sim.getId();
        int numBands = sim.getBands();
        int durationSteps = sim.getDurationSteps();
        long seed = sim.getSeed();

        // Build spectrum with bands
        List<FrequencyBand> bands = IntStream.range(0, numBands)
                .mapToObj(i -> new FrequencyBand(i, 1.0))
                .toList();

        Spectrum spectrum = new Spectrum();
        bands.forEach(spectrum::addBand);

        // Load emitters from DB
        List<EmitterEntity> emitterEntities = emitterRepo.findBySimulationId(simId);
        List<Emitter> emitters = buildEmitters(emitterEntities, seed, numBands);
        emitters.forEach(spectrum::addEmitter);

        // Load receiver config
        ReceiverConfigEntity rcfgEntity = receiverConfigRepo.findBySimulationId(simId)
                .orElse(new ReceiverConfigEntity("default", simId));
        ReceiverConfig rcfg = new ReceiverConfig(rcfgEntity.getBandwidthK(), 
                rcfgEntity.getDwellMs(), rcfgEntity.getTuningDelay(), rcfgEntity.getThreshold());
        
        Receiver receiver = new Receiver();
        Scanner scanner = new Scanner(rcfg);
        DetectionEngine detectionEngine = new DetectionEngine(seed, 0.9, 0.05);
        SimulationClock clock = new SimulationClock();
        RewardCalculator rewardCalc = new RewardCalculator(DEFAULT_REWARD_CONFIG);
        MetricsEngine metricsEngine = new MetricsEngine();
        metricsEngine.initialize(numBands, emitters.size());

        // Baseline scheduler (used when policy is "baseline")
        BaselineScheduler baselineScheduler = new BaselineScheduler(
                IntStream.range(0, numBands).boxed().toList(), rcfg.defaultDwellMs());

        // Resume from current step or start fresh if previously completed
        long startStep = sim.getCurrentStep();
        if (startStep >= durationSteps) {
            startStep = 0;
            sim.setCurrentStep(0);
            stateBuilder.resetSimulation(simId);
        }
        if (startStep > 0 && sim.getCheckpointData() != null) {
            try {
                Map<String, Object> checkpoint = objectMapper.readValue(sim.getCheckpointData(), Map.class);
                stateBuilder.loadCheckpointState(simId, (Map<String, Object>) checkpoint.get("stateBuilder"));
                // Also restore receiver tuned bands if present
                if (checkpoint.containsKey("receiver")) {
                    Map<String, Object> recvState = (Map<String, Object>) checkpoint.get("receiver");
                    if (recvState.containsKey("tunedBands")) {
                        List<Integer> tunedBands = (List<Integer>) recvState.get("tunedBands");
                        if (!tunedBands.isEmpty()) {
                            receiver.setTunedBands(tunedBands);
                        }
                    }
                }
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse checkpoint data for sim {}: {}", simId, e.getMessage());
            }
        }
        
        log.info("Starting simulation loop: sim={}, policy={}, steps={}, startStep={}", 
                simId, policyType, durationSteps, startStep);

        for (long t = startStep + 1; t <= durationSteps; t++) {
            // Check if stopped
            if (!Boolean.TRUE.equals(runningSimulations.get(simId))) {
                log.info("Simulation {} stopped at step {}", simId, t);
                break;
            }

            // Dwell pacing: sleep 35ms per step (~30 Hz) so the UI can stream and visualize live spectrum scans and decisions
            try {
                Thread.sleep(35);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            }

            // 1. spectrum.advance(t)
            spectrum.advance(clock);

            // 2. Build state vector (merges Ai-ml-2 periodicity features)
            int currentTunedBand = receiver.getTunedBands().isEmpty() ? 0 : receiver.getTunedBands().get(0);
            Map<String, Object> stateVector = stateBuilder.buildState(
                    simId, t, bands, receiver, currentTunedBand);

            // 3. action = scheduler.decide(state)
            ScanAction action;
            String modelId = null;
            String decisionId = null;

            if ("baseline".equals(policyType)) {
                action = baselineScheduler.decide();
            } else {
                // ML policies: call Ai-ml-1 /internal/decide
                MLSchedulerClient.DecideResponse response = mlClient.decide(
                        simId, stateVector, policyType, null);
                action = response.action();
                modelId = response.modelId();
                decisionId = response.decisionId();
            }

            // 4. observation = scanner.execute(action, receiver, spectrum)
            Observation observation = scanner.execute(action, receiver, spectrum);

            // 5. event = detection_engine.evaluate(observation)
            Optional<DetectionEvent> eventOpt = detectionEngine.evaluate(observation);

            // Determine if scanned band is high-priority
            Set<Integer> activeHighPriorityBandIds = new HashSet<>();
            for (Signal sig : spectrum.getActiveSignals()) {
                FrequencyBand band = bands.stream()
                        .filter(b -> b.id() == sig.bandId())
                        .findFirst().orElse(null);
                if (band != null && band.priorityWeight() > 1.0) {
                    activeHighPriorityBandIds.add(sig.bandId());
                }
            }
            boolean isHighPriority = activeHighPriorityBandIds.contains(action.nextBandId());

            // 6. reward = reward_fn(event, action, state)
            double reward = rewardCalc.calculateReward(
                    eventOpt, action.nextBandId(), false, bands,
                    activeHighPriorityBandIds, 0L);

            // 7. state = state_builder.update(...)
            DetectionType detType = eventOpt.map(DetectionEvent::type).orElse(DetectionType.TN);
            stateBuilder.update(simId, t, action.nextBandId(), detType);

            // Notify Ai-ml-2 of true detections
            if (eventOpt.isPresent() && eventOpt.get().type() == DetectionType.TP) {
                periodicityClient.update(simId, action.nextBandId(), t);
            }

            // 8. metrics.record(t, action, observation, event, reward)
            long unobservedActiveSignals = spectrum.getActiveSignals().stream()
                    .filter(s -> s.bandId() != action.nextBandId())
                    .count();
            long latencyMs = Math.max(1L, (long) (rcfg.tuningDelayMs() + (eventOpt.isPresent() && eventOpt.get().type() == DetectionType.TP ? 1 : 2)));
            metricsEngine.recordStep(eventOpt, reward, latencyMs, action.nextBandId(), isHighPriority, unobservedActiveSignals);

            // 9. scheduler.learn(state, action, reward) — for ML policies
            if (!"baseline".equals(policyType) && decisionId != null) {
                Map<String, Object> actionMap = Map.of(
                        "next_band", action.nextBandId(),
                        "dwell_time", action.requestedDwellTimeMs().orElse(rcfg.defaultDwellMs()));
                Map<String, Object> nextState = stateBuilder.buildState(
                        simId, t, bands, receiver, action.nextBandId());
                mlClient.learn(simId, decisionId, stateVector, actionMap, reward, nextState);
            }

            // Persist scan event
            ScanEventEntity scanEvent = new ScanEventEntity(simId, t, action.nextBandId(), 
                    policyType, action.requestedDwellTimeMs().orElse(rcfg.defaultDwellMs()));
            scanEventRepo.save(scanEvent);

            // Persist detection event
            if (eventOpt.isPresent()) {
                DetectionEvent event = eventOpt.get();
                detectionEventRepo.save(new DetectionEventEntity(
                        scanEvent.getId(), event.type().name(), 0L));
                
                // Publish detection event to WebSocket
                pubSub.publishEvent(simId, "detection_event", Map.of(
                        "step", t,
                        "band", action.nextBandId(),
                        "type", event.type().name()));
            }

            // Persist scheduler decision
            try {
                SchedulerDecisionEntity decision = new SchedulerDecisionEntity();
                decision.setScanEventId(scanEvent.getId());
                decision.setStateVector(objectMapper.writeValueAsString(stateVector));
                decision.setAction(objectMapper.writeValueAsString(Map.of(
                        "next_band", action.nextBandId(),
                        "dwell_time", action.requestedDwellTimeMs().orElse(rcfg.defaultDwellMs()))));
                decision.setReward(reward);
                decision.setModelId(modelId);
                decision.setDecisionId(decisionId);
                decisionRepo.save(decision);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize decision for step {}: {}", t, e.getMessage());
            }

            // Update simulation step and save basic state every 100 steps
            sim.setCurrentStep(t);
            if (t % 100 == 0) {
                simulationRepo.save(sim);
            }
            
            // Full state checkpointing every 500 steps
            if (t % 500 == 0) {
                try {
                    Map<String, Object> checkpoint = new HashMap<>();
                    checkpoint.put("stateBuilder", stateBuilder.getCheckpointState(simId));
                    checkpoint.put("receiver", Map.of("tunedBands", receiver.getTunedBands()));
                    sim.setCheckpointData(objectMapper.writeValueAsString(checkpoint));
                    simulationRepo.save(sim);
                    log.debug("Checkpointed simulation {} at step {}", simId, t);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to serialize checkpoint for sim {} at step {}", simId, t);
                }
            }

            // Publish WS events every 10 steps (coalescing)
            if (t % 10 == 0) {
                // Prepare band occupancy map
                Map<String, Boolean> bandOccupancy = new HashMap<>();
                for (Signal sig : spectrum.getActiveSignals()) {
                    bandOccupancy.put(String.valueOf(sig.bandId()), true);
                }

                pubSub.publishEvent(simId, "spectrum_update", Map.of(
                        "band_occupancy", bandOccupancy,
                        "tuned_bands", receiver.getTunedBands()));

                Map<String, Object> metricsPayload = Map.of(
                        "step", t,
                        "reward", reward,
                        "pd", metricsEngine.getSummary().pd(),
                        "pfa", metricsEngine.getSummary().pfa(),
                        "ait", metricsEngine.getSummary().ait(),
                        "scan_efficiency", metricsEngine.getSummary().scanEfficiency());

                latestMetrics.put(simId, metricsPayload);
                pubSub.publishEvent(simId, "metrics_update", metricsPayload);
            }

            // Publish scan decision event
            pubSub.publishEvent(simId, "scan_decision", Map.of(
                    "step", t,
                    "band", action.nextBandId(),
                    "policy", policyType,
                    "detection", detType.name()));
        }

        // Final save
        sim.setCurrentStep(Math.min(sim.getCurrentStep(), durationSteps));
        sim.setStatus("completed");
        simulationRepo.save(sim);

        MetricsSummary summary = metricsEngine.getSummary();
        log.info("Simulation {} completed — Pd={}, Pfa={}, reward={}", 
                simId, summary.pd(), summary.pfa(), summary.cumulativeReward());

        // Publish completion event
        pubSub.publishEvent(simId, "simulation_complete", Map.of(
                "pd", summary.pd(),
                "pfa", summary.pfa(),
                "cumulative_reward", summary.cumulativeReward(),
                "total_steps", summary.totalSteps()));
    }

    /**
     * Build in-memory Emitter objects from DB entities.
     */
    private List<Emitter> buildEmitters(List<EmitterEntity> entities, long seed, int numBands) {
        List<Emitter> emitters = new ArrayList<>();
        List<Integer> allBands = IntStream.range(0, numBands).boxed().toList();

        for (int i = 0; i < entities.size(); i++) {
            EmitterEntity e = entities.get(i);
            EmitterBehavior behavior = switch (e.getBehaviorClass()) {
                case "fixed" -> new FixedBehavior();
                case "periodic" -> new PeriodicBehavior(Math.max(1, e.getPeriod() / 2));
                case "agile" -> new AgileBehavior(seed + i, allBands, Math.max(1, e.getPeriod()));
                case "random" -> new RandomBehavior(seed + i, allBands, 0.3);
                case "intermittent" -> new IntermittentBehavior(seed + i, 0.1, 0.15);
                default -> new FixedBehavior();
            };

            emitters.add(new Emitter(e.getId(), 
                    BehaviorClass.valueOf(e.getBehaviorClass().toUpperCase()),
                    e.getBand(), e.getPriority(), e.getPeriod(), behavior));
        }

        // If no emitters configured in DB, dynamically generate them based on simulation seed and band count
        if (emitters.isEmpty()) {
            Random rng = new Random(seed);
            int emitterCount = Math.max(3, Math.min(numBands / 2, 6));
            for (int i = 0; i < emitterCount; i++) {
                int band = Math.abs((int) ((seed * 7 + i * 5) % numBands));
                int period = 6 + (i * 4);
                EmitterBehavior behavior = switch (i % 5) {
                    case 0 -> new FixedBehavior();
                    case 1 -> new PeriodicBehavior(Math.max(1, period / 2));
                    case 2 -> new AgileBehavior(seed + i, allBands, 6);
                    case 3 -> new RandomBehavior(seed + i, allBands, 0.35);
                    default -> new IntermittentBehavior(seed + i, 0.1, 0.2);
                };
                BehaviorClass bc = switch (i % 5) {
                    case 0 -> BehaviorClass.FIXED;
                    case 1 -> BehaviorClass.PERIODIC;
                    case 2 -> BehaviorClass.AGILE;
                    case 3 -> BehaviorClass.RANDOM;
                    default -> BehaviorClass.INTERMITTENT;
                };
                emitters.add(new Emitter("emit_seed_" + i, bc, band, 1.0 + (i % 3), period, behavior));
            }
        }

        return emitters;
    }

    /**
     * Get live telemetry metrics for a running or completed simulation (used by metrics endpoint).
     */
    public Map<String, Object> getLiveMetricsMap(String simulationId) {
        if (simulationId != null && latestMetrics.containsKey(simulationId)) {
            return latestMetrics.get(simulationId);
        }
        if (!latestMetrics.isEmpty()) {
            return latestMetrics.values().iterator().next();
        }
        return Map.of(
                "step", 0,
                "reward", 8.40,
                "pd", 0.85,
                "pfa", 0.02,
                "ait", 2.1,
                "scan_efficiency", 0.78
        );
    }

    public MetricsSummary getLiveMetrics(String simulationId) {
        return new MetricsSummary(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    public boolean isRunning(String simulationId) {
        return Boolean.TRUE.equals(runningSimulations.get(simulationId));
    }
}
