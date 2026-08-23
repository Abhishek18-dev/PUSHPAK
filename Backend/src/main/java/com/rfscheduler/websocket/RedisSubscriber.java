package com.rfscheduler.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class RedisSubscriber {
    private final CoalescingBuffer coalescingBuffer;
    private final SimulationWebSocketHandler wsHandler;
    private final ObjectMapper mapper = new ObjectMapper();

    public RedisSubscriber(CoalescingBuffer coalescingBuffer, SimulationWebSocketHandler wsHandler) {
        this.coalescingBuffer = coalescingBuffer;
        this.wsHandler = wsHandler;
    }

    public void receiveMessage(String message) {
        try {
            JsonNode root = mapper.readTree(message);
            String simId = root.get("simulationId").asText();
            String type = root.get("type").asText();
            String payloadToSend = mapper.writeValueAsString(root);
            
            if ("spectrum_update".equals(type)) {
                coalescingBuffer.queueSpectrumUpdate(simId, payloadToSend);
            } else {
                wsHandler.broadcastToSimulation(simId, payloadToSend);
            }
        } catch (Exception ignored) {}
    }
}
