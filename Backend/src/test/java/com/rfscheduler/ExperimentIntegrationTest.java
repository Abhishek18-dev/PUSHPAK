package com.rfscheduler;

import com.rfscheduler.domain.ExperimentEntity;
import com.rfscheduler.dto.ExperimentCreateRequest;
import com.rfscheduler.repository.ExperimentRepository;
import com.rfscheduler.repository.ExperimentRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static java.util.concurrent.TimeUnit.SECONDS;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class ExperimentIntegrationTest {

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer postgres = new PostgreSQLContainer(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("rfscheduler")
            .withUsername("test")
            .withPassword("test");

    @Container
    @SuppressWarnings("resource")
    static GenericContainer redis = new GenericContainer(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> postgres.getJdbcUrl());
        registry.add("spring.datasource.username", () -> postgres.getUsername());
        registry.add("spring.datasource.password", () -> postgres.getPassword());
        
        registry.add("spring.data.redis.host", () -> redis.getHost());
        registry.add("spring.data.redis.port", () -> redis.getFirstMappedPort());
        
        registry.add("rf.security.enabled", () -> "false");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ExperimentRepository experimentRepo;

    @Autowired
    private ExperimentRunRepository runRepo;

    @BeforeEach
    void setUp() {
        runRepo.deleteAll();
        experimentRepo.deleteAll();
    }

    @Test
    void testEndToEndExperimentFlow() {
        // 1. Create a minimal experiment (Scenario F: sparse, fast)
        ExperimentCreateRequest createReq = new ExperimentCreateRequest(
                "F", List.of("baseline"), "Integration Test Exp");

        ResponseEntity<Map> createResp = restTemplate.postForEntity(
                "/api/v1/experiments", createReq, Map.class);
        
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        Map<String, Object> data = (Map<String, Object>) createResp.getBody().get("data");
        String expId = (String) data.get("id");
        assertThat(expId).isNotNull();

        // 2. Start the experiment
        ResponseEntity<Map> startResp = restTemplate.postForEntity(
                "/api/v1/experiments/" + expId + "/run", null, Map.class);
        
        assertThat(startResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 3. Wait for the experiment to complete (simulation runs async)
        // Scenario F is 2000 steps, should take < 5 seconds in memory
        await().atMost(15, SECONDS).untilAsserted(() -> {
            ResponseEntity<Map> resultsResp = restTemplate.getForEntity(
                    "/api/v1/experiments/" + expId + "/results", Map.class);
            
            assertThat(resultsResp.getStatusCode()).isEqualTo(HttpStatus.OK);
            Map<String, Object> resData = (Map<String, Object>) resultsResp.getBody().get("data");
            
            assertThat(resData.get("status")).isEqualTo("completed");
            
            List<Map<String, Object>> runs = (List<Map<String, Object>>) resData.get("results");
            assertThat(runs).hasSize(1);
            assertThat(runs.get(0).get("status")).isEqualTo("completed");
        });
    }
}
