package com.arcadia.gateway.repository;

import com.arcadia.gateway.model.ApiRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApiRouteRepository extends JpaRepository<ApiRoute, Long> {
    Optional<ApiRoute> findByPathPattern(String pathPattern);
    Optional<ApiRoute> findByPathPatternAndEnabledTrue(String pathPattern);
}
