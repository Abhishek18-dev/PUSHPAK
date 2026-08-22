package com.rfscheduler.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // 60 requests per minute
        Refill refill = Refill.intervally(60, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(60, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket resolveBucket(HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        // Fallback if proxy is used
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            clientIp = forwardedFor.split(",")[0];
        }
        return cache.computeIfAbsent(clientIp, k -> createNewBucket());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getRequestURI();

        // Only apply rate limiting to write endpoints (POST, PUT, DELETE) on /api/v1/
        if (path.startsWith("/api/v1/") && 
            ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))) {
            
            Bucket bucket = resolveBucket(request);
            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Limit: 60 req/min/client.");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
