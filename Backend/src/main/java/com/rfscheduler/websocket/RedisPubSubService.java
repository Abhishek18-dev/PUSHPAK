package com.rfscheduler.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RedisPubSubService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public RedisPubSubService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publishEvent(String simulationId, String type, Map<String, Object> data) {
        try {
            String payload = mapper.writeValueAsString(Map.of(
                "simulationId", simulationId,
                "type", type,
                "data", data
            ));
            redisTemplate.convertAndSend(com.rfscheduler.config.RedisConfig.TOPIC_NAME, payload);
        } catch (Exception ignored) {}
    }
}
