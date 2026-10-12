package com.arcadiacomics.ventas.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PaymentCompletedSqsEvent {

    private String eventType = "PAYMENT_COMPLETED";
    private String source = "WEBPAY_PLUS";
    private String orderId;
    private String userId;
    private Double amount;
    private String buyOrder;
    private String authorizationCode;
    private String paymentTypeCode;
    private String cardLastDigits;
    private String status;
    private String timestamp;
    private List<OrderItemDTO> items;

    public PaymentCompletedSqsEvent() {
        this.timestamp = LocalDateTime.now().toString();
    }

    public PaymentCompletedSqsEvent(String orderId, String userId, Double amount, String buyOrder,
                                    String authorizationCode, String paymentTypeCode, String cardLastDigits,
                                    String status, List<OrderItemDTO> items) {
        this.eventType = "PAYMENT_COMPLETED";
        this.source = "WEBPAY_PLUS";
        this.orderId = orderId;
        this.userId = userId;
        this.amount = amount;
        this.buyOrder = buyOrder;
        this.authorizationCode = authorizationCode;
        this.paymentTypeCode = paymentTypeCode;
        this.cardLastDigits = cardLastDigits;
        this.status = status;
        this.timestamp = LocalDateTime.now().toString();
        this.items = items;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getBuyOrder() {
        return buyOrder;
    }

    public void setBuyOrder(String buyOrder) {
        this.buyOrder = buyOrder;
    }

    public String getAuthorizationCode() {
        return authorizationCode;
    }

    public void setAuthorizationCode(String authorizationCode) {
        this.authorizationCode = authorizationCode;
    }

    public String getPaymentTypeCode() {
        return paymentTypeCode;
    }

    public void setPaymentTypeCode(String paymentTypeCode) {
        this.paymentTypeCode = paymentTypeCode;
    }

    public String getCardLastDigits() {
        return cardLastDigits;
    }

    public void setCardLastDigits(String cardLastDigits) {
        this.cardLastDigits = cardLastDigits;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}
