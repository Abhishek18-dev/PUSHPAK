package com.rfscheduler.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rfscheduler.dto.SimulationCreateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.boot.test.mock.mockito.MockBean;
import com.rfscheduler.service.SimulationService;
import com.rfscheduler.repository.EmitterRepository;
import com.rfscheduler.util.AuditLogger;
import com.rfscheduler.domain.SimulationEntity;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SimulationController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class SimulationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SimulationService simulationService;

    @MockBean
    private EmitterRepository emitterRepo;

    @MockBean
    private AuditLogger auditLogger;

    @Test
    void createSimulation_Success() throws Exception {
        SimulationCreateRequest req = new SimulationCreateRequest("Test", 16, 1000, 42L);
        when(simulationService.create(any(), anyInt(), anyInt(), anyLong()))
                .thenReturn(new SimulationEntity("sim_1", "Test", 42L, 16, 1000));
        
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
