package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ModelEvaluateRequest(
    @NotBlank String scenario,
    @Positive @JsonProperty("episode_count") int episodeCount
) {}
