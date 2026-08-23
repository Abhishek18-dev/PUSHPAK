package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;

public record SimulationUpdateRequest(
    String name,
    @Min(1) Integer bands,
    @Min(1) @JsonProperty("duration_steps") Integer durationSteps,
    Long seed
) {}
