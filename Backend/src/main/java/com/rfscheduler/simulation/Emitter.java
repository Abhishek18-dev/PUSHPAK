package com.rfscheduler.simulation;

public record Emitter(
    String id,
    BehaviorClass behaviorClass,
    int primaryBandId,
    double priority,
    int period,
    EmitterBehavior behavior
) {
}
