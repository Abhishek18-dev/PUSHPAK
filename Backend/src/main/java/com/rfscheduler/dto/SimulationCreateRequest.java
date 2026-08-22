package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SimulationCreateRequest(
    @NotBlank String name,
    @Positive int bands,
    @Positive @JsonProperty("duration_steps") int durationSteps,
    @NotNull Long seed
) {}
