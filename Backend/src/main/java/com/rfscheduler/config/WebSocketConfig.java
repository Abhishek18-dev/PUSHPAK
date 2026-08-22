package com.rfscheduler.config;

import com.rfscheduler.websocket.SimulationWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);
    private final SimulationWebSocketHandler handler;

    public WebSocketConfig(SimulationWebSocketHandler handler) {
        this.handler = handler;
    }

    /**
     * Configure the Tomcat/Jetty WebSocket container with appropriate buffer sizes.
     * Without this, the default max text message buffer (8KB) can cause failures
     * with larger spectrum_update payloads.
     */
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(64 * 1024);   // 64 KB
        container.setMaxBinaryMessageBufferSize(64 * 1024);  // 64 KB
        container.setMaxSessionIdleTimeout(60000L);           // 60 seconds idle timeout
        container.setAsyncSendTimeout(30000L);                // 30 seconds async send timeout
        return container;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/v1/simulations/**")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        log.info("WebSocket handshake attempt from: {} (Origin: {})",
                                request.getURI(), request.getHeaders().getOrigin());
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               WebSocketHandler wsHandler, Exception exception) {
                        if (exception != null) {
                            log.error("WebSocket handshake failed", exception);
                        } else {
                            log.info("WebSocket handshake succeeded for: {}", request.getURI());
                        }
                    }
                });
    }
}

