package com.rfscheduler.repository;

import com.rfscheduler.domain.ModelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ModelRepository extends JpaRepository<ModelEntity, String> {
    List<ModelEntity> findByAlgorithm(String algorithm);
    List<ModelEntity> findByActive(boolean active);
    List<ModelEntity> findByAlgorithmAndActive(String algorithm, boolean active);
    Optional<ModelEntity> findByAlgorithmAndActiveTrue(String algorithm);
}
