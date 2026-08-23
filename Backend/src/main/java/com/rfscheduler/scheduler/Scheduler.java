package com.rfscheduler.scheduler;

import com.rfscheduler.receiver.ScanAction;

public interface Scheduler {
    ScanAction decide();
}
