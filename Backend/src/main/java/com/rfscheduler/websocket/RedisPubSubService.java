package com.rfscheduler.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Event broadcast service.
 * In accordance with FULL PROOF/Stack.md, uses local in-process delivery directly to 
 * SimulationWebSocketHandler for single-workstation local desktop operation, with optional
 * Redis relay if available.
 */
@Service
public class RedisPubSubService {

    private static final Logger log = LoggerFactory.getLogger(RedisPubSubService.class);

    private final SimulationWebSocketHandler webSocketHandler;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public RedisPubSubService(SimulationWebSocketHandler webSocketHandler,
                              @Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.webSocketHandler = webSocketHandler;
        this.redisTemplate = redisTemplate;
    }

    public void publishEvent(String simulationId, String type, Map<String, Object> data) {
        try {
            String payload = mapper.writeValueAsString(Map.of(
                "simulationId", simulationId,
                "type", type,
                "data", data
            ));

            // Direct local in-process broadcast for local desktop shell
            webSocketHandler.broadcastToSimulation(simulationId, payload);

            // Optional external Redis broadcast
            if (redisTemplate != null) {
                try {
                    redisTemplate.convertAndSend(com.rfscheduler.config.RedisConfig.TOPIC_NAME, payload);
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.debug("Error broadcasting event: {}", e.getMessage());
        }
    }
}
