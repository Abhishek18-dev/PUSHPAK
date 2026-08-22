package com.rfscheduler.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.Map;

public record ModelTrainRequest(
    @NotBlank String algorithm,
    @NotBlank String scenario,
    Map<String, Object> hyperparams,
    @Positive @JsonProperty("episode_count") int episodeCount
) {}
