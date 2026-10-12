package com.arcadiacomics.ventas.controller;

import com.arcadiacomics.ventas.dto.CheckoutRequest;
import com.arcadiacomics.ventas.dto.OrderResponse;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import com.arcadiacomics.ventas.service.OrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    @Value("${app.frontend.client-url:http://localhost:3000}")
    private String frontendClientUrl;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Endpoint de Checkout: Crea la orden y obtiene el token/URL de WebPay Plus Integración.
     */
    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        OrderResponse response = orderService.processCheckout(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * URL de Retorno de Transbank WebPay Plus.
     * WebPay redirige al usuario aquí (vía GET o POST) una vez finalizado o cancelado el intento de pago.
     */
    @RequestMapping(value = "/webpay/return", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Void> handleWebpayReturn(
            @RequestParam(value = "token_ws", required = false) String tokenWs,
            @RequestParam(value = "TBK_TOKEN", required = false) String tbkToken,
            @RequestParam(value = "token_tbk", required = false) String tokenTbk) {

        logger.info("Recibido retorno desde WebPay. token_ws={}, TBK_TOKEN={}, token_tbk={}", tokenWs, tbkToken, tokenTbk);

        String baseUrl = frontendClientUrl.endsWith("/") ?
                frontendClientUrl.substring(0, frontendClientUrl.length() - 1) : frontendClientUrl;

        // Caso 1: Flujo normal de pago (aprobado o rechazado por fondos)
        if (tokenWs != null && !tokenWs.isBlank()) {
            try {
                OrderResponse response = orderService.confirmWebpayPayment(tokenWs);
                if (response.getStatus() == OrderStatus.PAID) {
                    String redirectUrl = String.format("%s/cart?payment=success&orderId=%s&authCode=%s&amount=%.2f",
                            baseUrl,
                            response.getId(),
                            response.getAuthorizationCode() != null ? response.getAuthorizationCode() : "",
                            response.getTotalAmount() != null ? response.getTotalAmount() : 0.0);

                    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
                } else {
                    String redirectUrl = String.format("%s/cart?payment=rejected&orderId=%s",
                            baseUrl,
                            response.getId());
                    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
                }
            } catch (Exception e) {
                logger.error("Error al procesar retorno de WebPay: {}", e.getMessage(), e);
                String errorMsg = URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "Error en confirmación de pago", StandardCharsets.UTF_8);
                String redirectUrl = String.format("%s/cart?payment=error&message=%s", baseUrl, errorMsg);
                return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
            }
        }

        // Caso 2: El usuario canceló la compra en la pantalla de WebPay
        String cancelToken = tbkToken != null ? tbkToken : tokenTbk;
        if (cancelToken != null && !cancelToken.isBlank()) {
            orderService.handleWebpayCancellation(cancelToken);
            String redirectUrl = String.format("%s/cart?payment=cancelled", baseUrl);
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
        }

        // Caso por defecto
        String redirectUrl = String.format("%s/cart?payment=unknown", baseUrl);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
    }

    /**
     * Endpoint REST para confirmación directa (útil para pruebas o APIs).
     */
    @PostMapping("/webpay/commit")
    public ResponseEntity<OrderResponse> commitWebpay(@RequestBody Map<String, String> payload) {
        String tokenWs = payload.get("token_ws");
        if (tokenWs == null || tokenWs.isBlank()) {
            tokenWs = payload.get("token");
        }
        if (tokenWs == null || tokenWs.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        OrderResponse response = orderService.confirmWebpayPayment(tokenWs);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable String id,
            @RequestParam OrderStatus status) {
        OrderResponse response = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<OrderResponse>> getOrderHistory(@PathVariable String userId) {
        List<OrderResponse> response = orderService.getOrderHistory(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "microservicio-ventas",
                "port", "8082",
                "webpay", "INTEGRACION"
        ));
    }
}
