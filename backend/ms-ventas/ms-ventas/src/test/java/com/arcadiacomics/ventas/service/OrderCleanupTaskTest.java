package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para OrderCleanupTask")
class OrderCleanupTaskTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderCleanupTask orderCleanupTask;

    private Order orderPending1;
    private Order orderPending2;

    @BeforeEach
    void setUp() {
        orderPending1 = new Order();
        orderPending1.setId("order-1");
        orderPending1.setUserId("user-100");
        orderPending1.setTotalAmount(15.00);
        orderPending1.setStatus(OrderStatus.PENDING);
        orderPending1.setCreatedAt(LocalDateTime.now().minusMinutes(40));

        orderPending2 = new Order();
        orderPending2.setId("order-2");
        orderPending2.setUserId("user-200");
        orderPending2.setTotalAmount(35.00);
        orderPending2.setStatus(OrderStatus.PENDING);
        orderPending2.setCreatedAt(LocalDateTime.now().minusMinutes(45));
    }

    @Test
    @DisplayName("Debe cancelar las órdenes pendientes expiradas (hace más de 30 minutos) y guardarlas")
    void debeCancelarOrdenesExpiradasYGuardar() {
        List<Order> expiredOrders = new ArrayList<>();
        expiredOrders.add(orderPending1);
        expiredOrders.add(orderPending2);

        when(orderRepository.findByStatusAndCreatedAtBefore(eq(OrderStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(expiredOrders);
        when(orderRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        orderCleanupTask.cancelExpiredPendingOrders();

        assertEquals(OrderStatus.CANCELLED, orderPending1.getStatus());
        assertEquals(OrderStatus.CANCELLED, orderPending2.getStatus());

        verify(orderRepository, times(1))
                .findByStatusAndCreatedAtBefore(eq(OrderStatus.PENDING), any(LocalDateTime.class));
        verify(orderRepository, times(1)).saveAll(expiredOrders);
    }

    @Test
    @DisplayName("No debe hacer nada si no hay órdenes pendientes expiradas")
    void noDebeHacerNadaSiNoHayOrdenesExpiradas() {
        when(orderRepository.findByStatusAndCreatedAtBefore(eq(OrderStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        orderCleanupTask.cancelExpiredPendingOrders();

        verify(orderRepository, times(1))
                .findByStatusAndCreatedAtBefore(eq(OrderStatus.PENDING), any(LocalDateTime.class));
        verify(orderRepository, never()).saveAll(any());
        verify(orderRepository, never()).save(any());
    }
}
