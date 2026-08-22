package com.rfscheduler.repository;

import com.rfscheduler.domain.SimulationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SimulationRepository extends JpaRepository<SimulationEntity, String> {
    List<SimulationEntity> findByStatus(String status);
}
