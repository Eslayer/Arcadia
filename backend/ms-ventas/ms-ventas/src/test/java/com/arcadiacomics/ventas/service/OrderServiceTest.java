package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.CheckoutRequest;
import com.arcadiacomics.ventas.dto.OrderEventDTO;
import com.arcadiacomics.ventas.dto.OrderItemDTO;
import com.arcadiacomics.ventas.dto.OrderResponse;
import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.entity.OrderItem;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para OrderService")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEventPublisher eventPublisher;

    @InjectMocks
    private OrderService orderService;

    private Order orderTest;
    private CheckoutRequest checkoutRequestTest;

    @BeforeEach
    void setUp() {
        // Configurar una orden de prueba
        orderTest = new Order();
        orderTest.setId("order-123");
        orderTest.setUserId("user-456");
        orderTest.setTotalAmount(49.99);
        orderTest.setStatus(OrderStatus.PENDING);
        List<OrderItem> items = new ArrayList<>();
        items.add(new OrderItem("comic-abc", 2));
        orderTest.setItems(items);

        // Configurar una solicitud de checkout de prueba
        checkoutRequestTest = new CheckoutRequest();
        checkoutRequestTest.setUserId("user-456");
        checkoutRequestTest.setTotalAmount(49.99);
        
        OrderItemDTO itemDto = new OrderItemDTO();
        itemDto.setComicId("comic-abc");
        itemDto.setQuantity(2);
        checkoutRequestTest.setItems(Collections.singletonList(itemDto));
    }

    @Test
    @DisplayName("Debe procesar checkout exitosamente y guardar la orden como PENDING")
    void debeProcesarCheckoutExitosamente() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setId("order-123");
            return saved;
        });

        OrderResponse response = orderService.processCheckout(checkoutRequestTest);

        assertNotNull(response);
        assertEquals("order-123", response.getId());
        assertEquals("user-456", response.getUserId());
        assertEquals(49.99, response.getTotalAmount());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(1, response.getItems().size());
        assertEquals("comic-abc", response.getItems().get(0).getComicId());
        assertEquals(2, response.getItems().get(0).getQuantity());

        verify(orderRepository, times(1)).save(any(Order.class));
        verifyNoInteractions(eventPublisher); // El evento no debe dispararse en checkout (se hace en pago)
    }

    @Test
    @DisplayName("Debe obtener orden por ID cuando existe")
    void debeObtenerOrdenPorIdCuandoExiste() {
        when(orderRepository.findById("order-123")).thenReturn(Optional.of(orderTest));

        OrderResponse response = orderService.getOrderById("order-123");

        assertNotNull(response);
        assertEquals("order-123", response.getId());
        assertEquals("user-456", response.getUserId());
        verify(orderRepository, times(1)).findById("order-123");
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando la orden no existe por ID")
    void debeLanzarExcepcionCuandoOrdenNoExiste() {
        when(orderRepository.findById("invalid-id")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            orderService.getOrderById("invalid-id");
        });

        assertEquals("Order not found", exception.getMessage());
        verify(orderRepository, times(1)).findById("invalid-id");
    }

    @Test
    @DisplayName("Debe actualizar el estado a PAID y publicar un evento de orden pagada")
    void debeActualizarEstadoAPaidYPublicarEvento() {
        when(orderRepository.findById("order-123")).thenReturn(Optional.of(orderTest));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus("order-123", OrderStatus.PAID);

        assertNotNull(response);
        assertEquals(OrderStatus.PAID, response.getStatus());

        // Verificar que se haya guardado en repositorio
        verify(orderRepository, times(1)).save(orderTest);

        // Verificar publicación del evento
        ArgumentCaptor<OrderEventDTO> eventCaptor = ArgumentCaptor.forClass(OrderEventDTO.class);
        verify(eventPublisher, times(1)).publishOrderPaidEvent(eventCaptor.capture());

        OrderEventDTO eventDTO = eventCaptor.getValue();
        assertEquals("order-123", eventDTO.getOrderId());
        assertEquals("user-456", eventDTO.getUserId());
        assertEquals(1, eventDTO.getItems().size());
        assertEquals("comic-abc", eventDTO.getItems().get(0).getComicId());
        assertEquals(2, eventDTO.getItems().get(0).getQuantity());
    }

    @Test
    @DisplayName("Debe actualizar el estado a CANCELLED sin publicar evento")
    void debeActualizarEstadoACancelledSinPublicarEvento() {
        when(orderRepository.findById("order-123")).thenReturn(Optional.of(orderTest));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus("order-123", OrderStatus.CANCELLED);

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());

        verify(orderRepository, times(1)).save(orderTest);
        verifyNoInteractions(eventPublisher); // No debe publicar evento para CANCELLED
    }

    @Test
    @DisplayName("Debe lanzar excepción al actualizar estado de orden inexistente")
    void debeLanzarExcepcionAlActualizarEstadoDeOrdenInexistente() {
        when(orderRepository.findById("invalid-id")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            orderService.updateOrderStatus("invalid-id", OrderStatus.PAID);
        });

        assertEquals("Order not found", exception.getMessage());
        verify(orderRepository, never()).save(any());
        verifyNoInteractions(eventPublisher);
    }

    @Test
    @DisplayName("Debe retornar el historial de órdenes de un usuario")
    void debeRetornarHistorialDeOrdenesDeUsuario() {
        List<Order> orders = Collections.singletonList(orderTest);
        when(orderRepository.findByUserId("user-456")).thenReturn(orders);

        List<OrderResponse> result = orderService.getOrderHistory("user-456");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("order-123", result.get(0).getId());
        verify(orderRepository, times(1)).findByUserId("user-456");
    }

    @Test
    @DisplayName("Debe retornar todas las órdenes")
    void debeRetornarTodasLasOrdenes() {
        List<Order> orders = Collections.singletonList(orderTest);
        when(orderRepository.findAll()).thenReturn(orders);

        List<OrderResponse> result = orderService.getAllOrders();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("order-123", result.get(0).getId());
        verify(orderRepository, times(1)).findAll();
    }
}
