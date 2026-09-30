package com.arcadia.gateway.repository;

import com.arcadia.gateway.model.ApiLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiLogRepository extends JpaRepository<ApiLog, Long> {
    List<ApiLog> findTop100ByOrderByTimestampDesc();
    List<ApiLog> findByRoutePatternOrderByTimestampDesc(String routePattern);
}
