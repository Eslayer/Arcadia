package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.WebpayCommitResponse;
import com.arcadiacomics.ventas.dto.WebpayInitResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebpayService {

    private static final Logger logger = LoggerFactory.getLogger(WebpayService.class);

    @Value("${transbank.webpay.commerce-code:597055555532}")
    private String commerceCode;

    @Value("${transbank.webpay.api-key:579B532A7440BB061079DCD944E0EE86481E261648C18859362849C5B4333827}")
    private String apiKey;

    @Value("${transbank.webpay.base-url:https://webpay3gint.transbank.cl}")
    private String baseUrl;

    @Value("${transbank.webpay.return-url:http://localhost:8082/orders/webpay/return}")
    private String returnUrl;

    private final RestTemplate restTemplate;

    public WebpayService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Inicializa una transacción en el ambiente de integración de Transbank WebPay Plus.
     *
     * @param buyOrder  Identificador de la orden (máximo 26 caracteres)
     * @param sessionId Identificador de sesión (máximo 61 caracteres)
     * @param amount    Monto de la transacción (entero CLP)
     * @return WebpayInitResponse con el token y la URL de redirección
     */
    public WebpayInitResponse initTransaction(String buyOrder, String sessionId, double amount) {
        String url = baseUrl + "/rswebpaytransaction/api/webpay/v1.2/transactions";

        // Transbank buy_order no puede superar 26 caracteres
        String safeBuyOrder = buyOrder.length() > 26 ? buyOrder.substring(0, 26) : buyOrder;
        String safeSessionId = sessionId.length() > 60 ? sessionId.substring(0, 60) : sessionId;
        long safeAmount = Math.max(1, Math.round(amount));

        Map<String, Object> body = new HashMap<>();
        body.put("buy_order", safeBuyOrder);
        body.put("session_id", safeSessionId);
        body.put("amount", safeAmount);
        body.put("return_url", returnUrl);

        HttpHeaders headers = createHeaders();
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        logger.info("Iniciando transacción WebPay para Orden '{}', monto CLP {}", safeBuyOrder, safeAmount);

        try {
            ResponseEntity<WebpayInitResponse> response = restTemplate.postForEntity(
                    url,
                    requestEntity,
                    WebpayInitResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                logger.info("Transacción WebPay iniciada con éxito. Token: {}", response.getBody().getToken());
                return response.getBody();
            } else {
                throw new RuntimeException("Error al iniciar WebPay: Estado HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error al conectar con WebPay Plus: {}", e.getMessage(), e);
            throw new RuntimeException("Fallo al comunicarse con Transbank WebPay: " + e.getMessage(), e);
        }
    }

    /**
     * Confirma (commit) la transacción una vez que el usuario regresa desde WebPay.
     *
     * @param token Token de WebPay recibido en el retorno (token_ws)
     * @return WebpayCommitResponse con el resultado de la autorización
     */
    public WebpayCommitResponse commitTransaction(String token) {
        String url = baseUrl + "/rswebpaytransaction/api/webpay/v1.2/transactions/" + token;

        HttpHeaders headers = createHeaders();
        HttpEntity<String> requestEntity = new HttpEntity<>("{}", headers);

        logger.info("Confirmando (commit) transacción WebPay con token: {}", token);

        try {
            ResponseEntity<WebpayCommitResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    requestEntity,
                    WebpayCommitResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                WebpayCommitResponse commitResponse = response.getBody();
                logger.info("Respuesta de WebPay Commit: Status={}, ResponseCode={}, AuthCode={}",
                        commitResponse.getStatus(),
                        commitResponse.getResponseCode(),
                        commitResponse.getAuthorizationCode());
                return commitResponse;
            } else {
                throw new RuntimeException("Error en commit de WebPay: Estado HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Error al confirmar transacción WebPay con token {}: {}", token, e.getMessage(), e);
            throw new RuntimeException("Fallo al confirmar pago en Transbank WebPay: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Tbk-Api-Key-Id", commerceCode);
        headers.set("Tbk-Api-Key-Secret", apiKey);
        return headers;
    }

    public String getReturnUrl() {
        return returnUrl;
    }
}
