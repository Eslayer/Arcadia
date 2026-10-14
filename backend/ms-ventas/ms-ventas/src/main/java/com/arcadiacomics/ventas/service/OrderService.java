package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.*;
import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.entity.OrderItem;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;
    private final WebpayService webpayService;
    private final AwsSnsService awsSnsService;
    private final AwsSqsService awsSqsService;

    public OrderService(OrderRepository orderRepository,
                        OrderEventPublisher eventPublisher,
                        WebpayService webpayService,
                        AwsSnsService awsSnsService,
                        AwsSqsService awsSqsService) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
        this.webpayService = webpayService;
        this.awsSnsService = awsSnsService;
        this.awsSqsService = awsSqsService;
    }

    @Transactional
    public OrderResponse processCheckout(CheckoutRequest request) {
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus(OrderStatus.PENDING);

        List<OrderItem> items = request.getItems().stream()
                .map(dto -> new OrderItem(dto.getComicId(), dto.getQuantity()))
                .collect(Collectors.toList());
        order.setItems(items);

        Order savedOrder = orderRepository.save(order);

        // Generar buyOrder único de hasta 26 caracteres para Transbank WebPay
        String cleanId = savedOrder.getId().replace("-", "");
        String buyOrder = "ORD-" + (cleanId.length() > 20 ? cleanId.substring(0, 20) : cleanId);
        savedOrder.setBuyOrder(buyOrder);

        // Iniciar transacción en WebPay Plus Integración
        WebpayInitResponse initResponse = webpayService.initTransaction(
                buyOrder,
                savedOrder.getUserId(),
                savedOrder.getTotalAmount()
        );

        savedOrder.setWebpayToken(initResponse.getToken());
        orderRepository.save(savedOrder);

        OrderResponse response = new OrderResponse(savedOrder);
        response.setWebpayUrl(initResponse.getUrl());
        response.setWebpayToken(initResponse.getToken());
        return response;
    }

    @Transactional
    public OrderResponse confirmWebpayPayment(String tokenWs) {
        logger.info("Confirmando pago en WebPay con token_ws: {}", tokenWs);
        WebpayCommitResponse commitResponse = webpayService.commitTransaction(tokenWs);

        // Buscar orden por token o buyOrder
        Order order = orderRepository.findByWebpayToken(tokenWs)
                .or(() -> orderRepository.findByBuyOrder(commitResponse.getBuyOrder()))
                .orElseThrow(() -> new RuntimeException("Orden no encontrada para token WebPay: " + tokenWs));

        if (commitResponse.isApproved()) {
            logger.info("Pago APROBADO por WebPay para orden ID: {}", order.getId());
            order.setStatus(OrderStatus.PAID);
            order.setAuthorizationCode(commitResponse.getAuthorizationCode());
            order.setPaymentTypeCode(commitResponse.getPaymentTypeCode());
            if (commitResponse.getCardDetail() != null) {
                order.setCardLastDigits(commitResponse.getCardDetail().getCardNumber());
            }

            Order savedOrder = orderRepository.save(order);

            // 1. Notificar a RabbitMQ (evento interno de la arquitectura Arcadia)
            publishRabbitMqEvent(savedOrder);

            // 2. Publicar en Amazon SNS para Fan-out hacia múltiples colas Amazon SQS
            publishSnsFanOutEvent(savedOrder, commitResponse);

            return new OrderResponse(savedOrder);
        } else {
            logger.warn("Pago RECHAZADO por WebPay. ResponseCode={}, Status={}",
                    commitResponse.getResponseCode(), commitResponse.getStatus());
            order.setStatus(OrderStatus.FAILED);
            Order savedOrder = orderRepository.save(order);
            return new OrderResponse(savedOrder);
        }
    }

    @Transactional
    public OrderResponse handleWebpayCancellation(String token) {
        logger.warn("Transacción WebPay cancelada o abortada por el usuario. Token: {}", token);
        Optional<Order> orderOpt = orderRepository.findByWebpayToken(token);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setStatus(OrderStatus.CANCELLED);
            Order savedOrder = orderRepository.save(order);
            return new OrderResponse(savedOrder);
        }
        return null;
    }

    private void publishRabbitMqEvent(Order order) {
        try {
            OrderEventDTO eventDTO = new OrderEventDTO(
                    order.getId(),
                    order.getUserId(),
                    order.getItems().stream().map(i -> {
                        OrderItemDTO dto = new OrderItemDTO();
                        dto.setComicId(i.getComicId());
                        dto.setQuantity(i.getQuantity());
                        return dto;
                    }).collect(Collectors.toList())
            );
            eventPublisher.publishOrderPaidEvent(eventDTO);
            logger.info("✔ Evento publicado en RabbitMQ para orden: {}", order.getId());
        } catch (Exception e) {
            logger.error("Error al publicar evento en RabbitMQ: {}", e.getMessage());
        }
    }

    private void publishSnsFanOutEvent(Order order, WebpayCommitResponse commitResponse) {
        try {
            List<OrderItemDTO> itemsDTO = order.getItems().stream().map(i -> {
                OrderItemDTO dto = new OrderItemDTO();
                dto.setComicId(i.getComicId());
                dto.setQuantity(i.getQuantity());
                return dto;
            }).collect(Collectors.toList());

            PaymentCompletedEvent snsEvent = new PaymentCompletedEvent(
                    order.getId(),
                    order.getUserId(),
                    order.getTotalAmount(),
                    order.getBuyOrder(),
                    commitResponse.getAuthorizationCode(),
                    commitResponse.getPaymentTypeCode(),
                    commitResponse.getCardDetail() != null ? commitResponse.getCardDetail().getCardNumber() : null,
                    "AUTHORIZED",
                    itemsDTO
            );

            // Publicación al Tópico SNS (el cual distribuye automáticamente por Fan-out a las colas SQS)
            String messageId = awsSnsService.publishPaymentCompletedEvent(snsEvent);
            logger.info("✔ Evento de pago WebPay publicado en Amazon SNS (Fan-out a SQS) [Result ID: {}]", messageId);

            // Opcional: si existe una cola SQS directa configurada, se registra también en el servicio SQS
            PaymentCompletedSqsEvent sqsEvent = new PaymentCompletedSqsEvent(
                    order.getId(),
                    order.getUserId(),
                    order.getTotalAmount(),
                    order.getBuyOrder(),
                    commitResponse.getAuthorizationCode(),
                    commitResponse.getPaymentTypeCode(),
                    commitResponse.getCardDetail() != null ? commitResponse.getCardDetail().getCardNumber() : null,
                    "AUTHORIZED",
                    itemsDTO
            );
            awsSqsService.sendPaymentCompletedMessage(sqsEvent);

        } catch (Exception e) {
            logger.error("Error al despachar evento de pago a Amazon SNS/SQS: {}", e.getMessage());
        }
    }

    public OrderResponse getOrderById(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return new OrderResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(String id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);

        if (status == OrderStatus.PAID) {
            publishRabbitMqEvent(updatedOrder);
        }

        return new OrderResponse(updatedOrder);
    }

    public List<OrderResponse> getOrderHistory(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }
}
