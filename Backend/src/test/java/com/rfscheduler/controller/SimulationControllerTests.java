package com.rfscheduler.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rfscheduler.dto.SimulationCreateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SimulationController.class)
class SimulationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createSimulation_Success() throws Exception {
        SimulationCreateRequest req = new SimulationCreateRequest("Test", 16, 1000, 42L);
        
        mockMvc.perform(post("/api/v1/simulations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.status").value("draft"))
                .andExpect(jsonPath("$.requestId").exists());
    }

    @Test
    void createSimulation_ValidationError() throws Exception {
        SimulationCreateRequest req = new SimulationCreateRequest("", 16, -100, 42L);
        
        mockMvc.perform(post("/api/v1/simulations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity()) // 422
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.name").exists())
                .andExpect(jsonPath("$.error.details.durationSteps").exists());
    }
}
