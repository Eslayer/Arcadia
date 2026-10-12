package com.arcadiacomics.ventas.repository;

import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    List<Order> findByUserId(String userId);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime date);

    java.util.Optional<Order> findByBuyOrder(String buyOrder);

    java.util.Optional<Order> findByWebpayToken(String webpayToken);
}
