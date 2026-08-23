package com.rfscheduler.receiver;

public record ReceiverConfig(
    int bandwidthK,
    int defaultDwellMs,
    int tuningDelayMs,
    double threshold
) {}
