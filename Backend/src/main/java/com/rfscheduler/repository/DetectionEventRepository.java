package com.rfscheduler.repository;

import com.rfscheduler.domain.DetectionEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetectionEventRepository extends JpaRepository<DetectionEventEntity, Long> {
}
