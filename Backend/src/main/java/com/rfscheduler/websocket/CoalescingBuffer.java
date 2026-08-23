package com.rfscheduler.websocket;

import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@EnableScheduling
public class CoalescingBuffer {
    
    private final SimulationWebSocketHandler wsHandler;
    private final Map<String, String> latestSpectrumUpdates = new ConcurrentHashMap<>();

    public CoalescingBuffer(SimulationWebSocketHandler wsHandler) {
        this.wsHandler = wsHandler;
    }

    public void queueSpectrumUpdate(String simulationId, String jsonPayload) {
        latestSpectrumUpdates.put(simulationId, jsonPayload);
    }

    @Scheduled(fixedRate = 100)
    public void flushUpdates() {
        latestSpectrumUpdates.forEach((simId, payload) -> {
            wsHandler.broadcastToSimulation(simId, payload);
            latestSpectrumUpdates.remove(simId);
        });
    }

    @Scheduled(fixedRate = 15000)
    public void heartbeats() {
        wsHandler.checkHeartbeats();
    }
}
