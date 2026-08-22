package com.rfscheduler.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

@Component
public class SimulationWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SimulationWebSocketHandler.class);

    private final Map<String, List<WebSocketSession>> activeSessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Per-session lock objects to prevent concurrent sendMessage() calls.
     * Spring's WebSocketSession is NOT thread-safe for concurrent sends.
     */
    private final Map<String, Object> sessionLocks = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            log.error("WebSocket session has null URI — closing connection");
            session.close(CloseStatus.SERVER_ERROR);
            return;
        }

        String path = uri.getPath();
        log.info("WebSocket connection request for path: {}", path);

        // Extract simulation ID — the last path segment after /ws/v1/simulations/
        String simId = extractSimulationId(path);
        if (simId == null || simId.isBlank()) {
            log.error("Could not extract simulation ID from path: {} — closing connection", path);
            session.sendMessage(new TextMessage(mapper.writeValueAsString(
                    Map.of("type", "error", "code", "INVALID_PATH",
                            "message", "WebSocket path must be /ws/v1/simulations/{simulationId}"))));
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        session.getAttributes().put("simulationId", simId);
        session.getAttributes().put("lastPong", System.currentTimeMillis());

        // Register session lock for thread-safe sends
        sessionLocks.put(session.getId(), new Object());

        activeSessions.computeIfAbsent(simId, k -> new CopyOnWriteArrayList<>()).add(session);

        log.info("WebSocket connected — session={}, simulationId={}", session.getId(), simId);
        sendSafe(session, new TextMessage(mapper.writeValueAsString(
                Map.of("type", "connection_ack", "simulationId", simId))));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("WebSocket message received — session={}, payload={}", session.getId(), payload);

        // Accept pong in multiple formats for robustness (JSON or plain text)
        String lower = payload.trim().toLowerCase();
        if (lower.contains("pong") || lower.contains("\"type\":\"pong\"")) {
            session.getAttributes().put("lastPong", System.currentTimeMillis());
            log.debug("Pong received from session={}", session.getId());
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String simId = (String) session.getAttributes().get("simulationId");
        log.error("WebSocket transport error — session={}, simulationId={}, error={}",
                session.getId(), simId, exception.getMessage(), exception);
        super.handleTransportError(session, exception);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String simId = (String) session.getAttributes().get("simulationId");
        log.info("WebSocket disconnected — session={}, simulationId={}, status={}",
                session.getId(), simId, status);

        // Clean up session lock
        sessionLocks.remove(session.getId());

        if (simId != null) {
            List<WebSocketSession> sessions = activeSessions.get(simId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    activeSessions.remove(simId);
                }
            }
        }
    }

    public void broadcastToSimulation(String simulationId, String jsonPayload) {
        List<WebSocketSession> sessions = activeSessions.get(simulationId);
        if (sessions != null) {
            TextMessage msg = new TextMessage(jsonPayload);
            sessions.removeIf(session -> {
                if (!session.isOpen()) return true;
                try {
                    sendSafe(session, msg);
                    return false;
                } catch (IOException e) {
                    log.warn("Failed to send message to session={} — removing", session.getId(), e);
                    return true;
                }
            });
        }
    }

    public void checkHeartbeats() {
        long now = System.currentTimeMillis();
        activeSessions.values().forEach(list -> {
            list.removeIf(session -> {
                if (!session.isOpen()) return true;
                Long lastPong = (Long) session.getAttributes().get("lastPong");
                // Allow 25s grace period (instead of 10s) to be more forgiving
                if (lastPong != null && now - lastPong > 25000) {
                    String simId = (String) session.getAttributes().get("simulationId");
                    log.warn("Heartbeat timeout — closing session={}, simulationId={}, lastPong={}ms ago",
                            session.getId(), simId, now - lastPong);
                    try {
                        session.close(CloseStatus.SESSION_NOT_RELIABLE);
                    } catch (IOException ignored) {}
                    return true;
                }
                try {
                    sendSafe(session, new TextMessage(mapper.writeValueAsString(Map.of("type", "ping"))));
                } catch (IOException e) {
                    log.warn("Failed to send ping to session={} — removing", session.getId());
                    return true;
                }
                return false;
            });
        });
    }

    /**
     * Thread-safe wrapper around session.sendMessage().
     * WebSocketSession is NOT thread-safe for concurrent sends — concurrent calls
     * from @Scheduled threads (CoalescingBuffer + heartbeats) can cause
     * "Failed to send message within the configured send limit" (close code 4500).
     */
    private void sendSafe(WebSocketSession session, TextMessage message) throws IOException {
        Object lock = sessionLocks.get(session.getId());
        if (lock == null) {
            // Session not yet registered or already cleaned up — send directly
            session.sendMessage(message);
            return;
        }
        synchronized (lock) {
            if (session.isOpen()) {
                session.sendMessage(message);
            }
        }
    }

    /**
     * Extracts the simulation ID from a path like /ws/v1/simulations/{simulationId}.
     * Returns null if the path doesn't match the expected format.
     */
    private String extractSimulationId(String path) {
        if (path == null) return null;
        String prefix = "/ws/v1/simulations/";
        int idx = path.indexOf(prefix);
        if (idx == -1) {
            // Fallback: just use the last path segment
            int lastSlash = path.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < path.length() - 1) {
                return path.substring(lastSlash + 1);
            }
            return null;
        }
        String remaining = path.substring(idx + prefix.length());
        // Strip any trailing slashes or query params
        int end = remaining.indexOf('/');
        if (end == -1) end = remaining.indexOf('?');
        if (end == -1) end = remaining.length();
        String simId = remaining.substring(0, end).trim();
        return simId.isEmpty() ? null : simId;
    }
}
