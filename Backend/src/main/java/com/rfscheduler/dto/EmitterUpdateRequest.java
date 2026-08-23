package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

public record EmitterUpdateRequest(
    @JsonProperty("behavior_class") String behaviorClass,
    @Min(0) Integer band,
    @Min(0) Integer period,
    @Min(0) Double priority
) {}
