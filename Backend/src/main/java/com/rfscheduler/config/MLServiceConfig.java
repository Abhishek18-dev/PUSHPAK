package com.rfscheduler.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "rf.ml")
public class MLServiceConfig {

    private SchedulerEngine scheduler = new SchedulerEngine();
    private PeriodicityEngine periodicity = new PeriodicityEngine();

    public static class SchedulerEngine {
        private String url = "http://localhost:8500";
        private boolean enabled = false;
        private int timeoutMs = 5000;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getTimeoutMs() { return timeoutMs; }
        public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
    }

    public static class PeriodicityEngine {
        private String url = "http://localhost:8600";
        private boolean enabled = false;
        private int timeoutMs = 5000;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getTimeoutMs() { return timeoutMs; }
        public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
    }

    public SchedulerEngine getScheduler() { return scheduler; }
    public void setScheduler(SchedulerEngine scheduler) { this.scheduler = scheduler; }
    public PeriodicityEngine getPeriodicity() { return periodicity; }
    public void setPeriodicity(PeriodicityEngine periodicity) { this.periodicity = periodicity; }

    @Bean(name = "mlSchedulerRestTemplate")
    public RestTemplate mlSchedulerRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(scheduler.getUrl())
                .setConnectTimeout(Duration.ofMillis(scheduler.getTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(scheduler.getTimeoutMs()))
                .build();
    }

    @Bean(name = "mlPeriodicityRestTemplate")
    public RestTemplate mlPeriodicityRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(periodicity.getUrl())
                .setConnectTimeout(Duration.ofMillis(periodicity.getTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(periodicity.getTimeoutMs()))
                .build();
    }
}
