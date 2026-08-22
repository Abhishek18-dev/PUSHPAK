package com.rfscheduler.websocket;

import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class WebSocketCoalescingTests {

    @Test
    void testCoalescingDropsIntermediateFrames() {
        SimulationWebSocketHandler handler = mock(SimulationWebSocketHandler.class);
        CoalescingBuffer buffer = new CoalescingBuffer(handler);
        
        for (int i = 0; i < 100; i++) {
            buffer.queueSpectrumUpdate("sim_1", "{\"type\":\"spectrum_update\", \"val\":" + i + "}");
        }
        
        buffer.flushUpdates();
        
        verify(handler, times(1)).broadcastToSimulation("sim_1", "{\"type\":\"spectrum_update\", \"val\":99}");
        
        buffer.flushUpdates();
        verifyNoMoreInteractions(handler);
    }
}
