package com.rfscheduler.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ExperimentCreateRequest(
    @NotBlank String scenario,
    @NotEmpty List<String> policies,
    String name
) {}
