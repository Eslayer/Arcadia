package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.*;
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
@DisplayName("Tests para OrderService con WebPay y Amazon SQS")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderEventPublisher eventPublisher;

    @Mock
    private WebpayService webpayService;

    @Mock
    private AwsSqsService awsSqsService;

    @InjectMocks
    private OrderService orderService;

    private Order orderTest;
    private CheckoutRequest checkoutRequestTest;

    @BeforeEach
    void setUp() {
        orderTest = new Order();
        orderTest.setId("order-123");
        orderTest.setUserId("user-456");
        orderTest.setTotalAmount(49.99);
        orderTest.setStatus(OrderStatus.PENDING);
        List<OrderItem> items = new ArrayList<>();
        items.add(new OrderItem("comic-abc", 2));
        orderTest.setItems(items);

        checkoutRequestTest = new CheckoutRequest();
        checkoutRequestTest.setUserId("user-456");
        checkoutRequestTest.setTotalAmount(49.99);

        OrderItemDTO itemDto = new OrderItemDTO();
        itemDto.setComicId("comic-abc");
        itemDto.setQuantity(2);
        checkoutRequestTest.setItems(Collections.singletonList(itemDto));
    }

    @Test
    @DisplayName("Debe procesar checkout exitosamente e inicializar WebPay")
    void debeProcesarCheckoutExitosamente() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId("order-123");
            }
            return saved;
        });

        when(webpayService.initTransaction(anyString(), anyString(), anyDouble()))
                .thenReturn(new WebpayInitResponse("token-test-123", "https://webpay3gint.transbank.cl/webpayserver/initTransaction"));

        OrderResponse response = orderService.processCheckout(checkoutRequestTest);

        assertNotNull(response);
        assertEquals("order-123", response.getId());
        assertEquals("user-456", response.getUserId());
        assertEquals(49.99, response.getTotalAmount());
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals("token-test-123", response.getWebpayToken());
        assertEquals("https://webpay3gint.transbank.cl/webpayserver/initTransaction", response.getWebpayUrl());

        verify(orderRepository, atLeastOnce()).save(any(Order.class));
        verify(webpayService, times(1)).initTransaction(anyString(), eq("user-456"), eq(49.99));
        verifyNoInteractions(eventPublisher);
        verifyNoInteractions(awsSqsService);
    }

    @Test
    @DisplayName("Debe confirmar pago exitoso en WebPay y publicar en RabbitMQ y Amazon SQS")
    void debeConfirmarPagoWebpayYPublicarEnSqs() {
        orderTest.setWebpayToken("token-test-123");
        when(orderRepository.findByWebpayToken("token-test-123")).thenReturn(Optional.of(orderTest));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WebpayCommitResponse commitResponse = new WebpayCommitResponse();
        commitResponse.setStatus("AUTHORIZED");
        commitResponse.setResponseCode(0);
        commitResponse.setAuthorizationCode("123456");
        commitResponse.setPaymentTypeCode("VD");
        commitResponse.setCardDetail(new WebpayCommitResponse.CardDetail("6623"));
        when(webpayService.commitTransaction("token-test-123")).thenReturn(commitResponse);

        OrderResponse response = orderService.confirmWebpayPayment("token-test-123");

        assertNotNull(response);
        assertEquals(OrderStatus.PAID, response.getStatus());
        assertEquals("123456", response.getAuthorizationCode());
        assertEquals("6623", response.getCardLastDigits());

        // Verificar publicación en RabbitMQ
        verify(eventPublisher, times(1)).publishOrderPaidEvent(any(OrderEventDTO.class));

        // Verificar publicación en Amazon SQS
        ArgumentCaptor<PaymentCompletedSqsEvent> sqsCaptor = ArgumentCaptor.forClass(PaymentCompletedSqsEvent.class);
        verify(awsSqsService, times(1)).sendPaymentCompletedMessage(sqsCaptor.capture());
        PaymentCompletedSqsEvent sqsEvent = sqsCaptor.getValue();
        assertEquals("order-123", sqsEvent.getOrderId());
        assertEquals("123456", sqsEvent.getAuthorizationCode());
        assertEquals("AUTHORIZED", sqsEvent.getStatus());
    }

    @Test
    @DisplayName("Debe marcar orden como CANCELLED al cancelar en WebPay")
    void debeMarcarOrdenComoCanceladaAlCancelarWebpay() {
        orderTest.setWebpayToken("tbk-token-cancelled");
        when(orderRepository.findByWebpayToken("tbk-token-cancelled")).thenReturn(Optional.of(orderTest));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.handleWebpayCancellation("tbk-token-cancelled");

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        verify(orderRepository, times(1)).save(orderTest);
        verifyNoInteractions(eventPublisher);
        verifyNoInteractions(awsSqsService);
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

        verify(orderRepository, times(1)).save(orderTest);

        ArgumentCaptor<OrderEventDTO> eventCaptor = ArgumentCaptor.forClass(OrderEventDTO.class);
        verify(eventPublisher, times(1)).publishOrderPaidEvent(eventCaptor.capture());

        OrderEventDTO eventDTO = eventCaptor.getValue();
        assertEquals("order-123", eventDTO.getOrderId());
        assertEquals("user-456", eventDTO.getUserId());
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
