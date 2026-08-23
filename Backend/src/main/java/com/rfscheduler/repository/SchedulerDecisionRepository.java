package com.rfscheduler.repository;

import com.rfscheduler.domain.SchedulerDecisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SchedulerDecisionRepository extends JpaRepository<SchedulerDecisionEntity, Long> {
    Page<SchedulerDecisionEntity> findByScanEventIdInOrderByIdDesc(java.util.List<Long> scanEventIds, Pageable pageable);
}
