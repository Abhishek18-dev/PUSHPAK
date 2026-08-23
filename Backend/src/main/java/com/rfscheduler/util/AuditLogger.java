package com.rfscheduler.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.Marker;
import org.slf4j.MarkerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuditLogger {

    private static final Logger log = LoggerFactory.getLogger(AuditLogger.class);
    private static final Marker AUDIT_MARKER = MarkerFactory.getMarker("AUDIT");

    public void logActivation(String modelId, String userOrSystem) {
        log.info(AUDIT_MARKER, "Model activation: modelId={}, initiatedBy={}", modelId, userOrSystem);
    }

    public void logConfigChange(String resourceType, String resourceId, String changes, String userOrSystem) {
        log.info(AUDIT_MARKER, "Config change: type={}, id={}, changes={}, initiatedBy={}", 
                resourceType, resourceId, changes, userOrSystem);
    }
}
