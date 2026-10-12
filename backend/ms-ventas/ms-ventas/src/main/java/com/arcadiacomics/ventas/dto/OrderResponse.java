package com.arcadiacomics.ventas.dto;

import com.arcadiacomics.ventas.model.entity.Order;
import com.arcadiacomics.ventas.model.enums.OrderStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {

    private String id;
    private String userId;
    private Double totalAmount;
    private OrderStatus status;
    private List<OrderItemDTO> items;
    private LocalDateTime createdAt;
    private String buyOrder;
    private String webpayToken;
    private String webpayUrl;
    private String authorizationCode;
    private String cardLastDigits;

    public OrderResponse() {
    }

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.userId = order.getUserId();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.buyOrder = order.getBuyOrder();
        this.webpayToken = order.getWebpayToken();
        this.authorizationCode = order.getAuthorizationCode();
        this.cardLastDigits = order.getCardLastDigits();
        if (order.getItems() != null) {
            this.items = order.getItems().stream().map(item -> {
                OrderItemDTO dto = new OrderItemDTO();
                dto.setComicId(item.getComicId());
                dto.setQuantity(item.getQuantity());
                return dto;
            }).collect(Collectors.toList());
        }
        this.createdAt = order.getCreatedAt();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getBuyOrder() {
        return buyOrder;
    }

    public void setBuyOrder(String buyOrder) {
        this.buyOrder = buyOrder;
    }

    public String getWebpayToken() {
        return webpayToken;
    }

    public void setWebpayToken(String webpayToken) {
        this.webpayToken = webpayToken;
    }

    public String getWebpayUrl() {
        return webpayUrl;
    }

    public void setWebpayUrl(String webpayUrl) {
        this.webpayUrl = webpayUrl;
    }

    public String getAuthorizationCode() {
        return authorizationCode;
    }

    public void setAuthorizationCode(String authorizationCode) {
        this.authorizationCode = authorizationCode;
    }

    public String getCardLastDigits() {
        return cardLastDigits;
    }

    public void setCardLastDigits(String cardLastDigits) {
        this.cardLastDigits = cardLastDigits;
    }
}
