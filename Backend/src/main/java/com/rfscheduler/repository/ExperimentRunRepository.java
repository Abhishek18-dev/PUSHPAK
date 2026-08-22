package com.rfscheduler.repository;

import com.rfscheduler.domain.ExperimentRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExperimentRunRepository extends JpaRepository<ExperimentRunEntity, Long> {
    List<ExperimentRunEntity> findByExperimentId(String experimentId);
}
