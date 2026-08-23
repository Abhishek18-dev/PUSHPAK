package com.rfscheduler.repository;

import com.rfscheduler.domain.EmitterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmitterRepository extends JpaRepository<EmitterEntity, String> {
    List<EmitterEntity> findBySimulationId(String simulationId);
    void deleteBySimulationId(String simulationId);
}
