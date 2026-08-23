package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record EmitterCreateRequest(
    @NotBlank @JsonProperty("simulation_id") String simulationId,
    @JsonProperty("behavior_class") String behaviorClass,
    @Min(0) int band,
    @Min(0) int period,
    @Min(0) double priority
) {}
