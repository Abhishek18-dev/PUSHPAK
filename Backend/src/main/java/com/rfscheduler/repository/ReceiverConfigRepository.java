package com.rfscheduler.repository;

import com.rfscheduler.domain.ReceiverConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReceiverConfigRepository extends JpaRepository<ReceiverConfigEntity, String> {
    Optional<ReceiverConfigEntity> findBySimulationId(String simulationId);
}
