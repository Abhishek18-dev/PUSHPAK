package com.rfscheduler.repository;

import com.rfscheduler.domain.ScanEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ScanEventRepository extends JpaRepository<ScanEventEntity, Long> {
    Page<ScanEventEntity> findBySimulationIdOrderByTDesc(String simulationId, Pageable pageable);
    void deleteBySimulationId(String simulationId);
}
