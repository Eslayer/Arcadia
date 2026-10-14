package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.PaymentCompletedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.SnsClientBuilder;
import software.amazon.awssdk.services.sns.model.MessageAttributeValue;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

import java.util.HashMap;
import java.util.Map;

@Service
public class AwsSnsService {

    private static final Logger logger = LoggerFactory.getLogger(AwsSnsService.class);

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.sns.topic-arn:}")
    private String topicArn;

    @Value("${aws.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:}")
    private String secretAccessKey;

    @Value("${aws.sns.enabled:true}")
    private boolean snsEnabled;

    private final ObjectMapper objectMapper;
    private SnsClient snsClient;

    public AwsSnsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private synchronized SnsClient getSnsClient() {
        if (this.snsClient != null) {
            return this.snsClient;
        }

        try {
            SnsClientBuilder builder = SnsClient.builder()
                    .region(Region.of(awsRegion));

            if (accessKeyId != null && !accessKeyId.isBlank() &&
                secretAccessKey != null && !secretAccessKey.isBlank()) {
                builder.credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim())
                ));
            } else {
                builder.credentialsProvider(DefaultCredentialsProvider.create());
            }

            this.snsClient = builder.build();
            return this.snsClient;
        } catch (Exception e) {
            logger.warn("No se pudo inicializar SnsClient con credenciales estándar: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Publica el evento de pago completado en el Tópico de Amazon SNS.
     * Mediante el patrón Fan-out, SNS distribuirá este mensaje de forma paralela
     * e idéntica a todas las colas Amazon SQS suscritas (ej: facturación, inventario, despacho).
     *
     * @param event DTO con los detalles del pago de WebPay Plus
     * @return El MessageId retornado por AWS SNS (o un ID de simulación si no está configurado)
     */
    public String publishPaymentCompletedEvent(PaymentCompletedEvent event) {
        if (!snsEnabled) {
            logger.info("[Amazon SNS] Publicación en SNS deshabilitada por configuración (aws.sns.enabled=false).");
            return "SNS_DISABLED";
        }

        try {
            String jsonPayload = objectMapper.writeValueAsString(event);

            if (topicArn == null || topicArn.isBlank()) {
                logger.warn("==========================================================================");
                logger.warn("📣 [AMAZON SNS FAN-OUT - MODO EDUCATIVO / SIMULADO]");
                logger.warn("La propiedad 'aws.sns.topic-arn' está vacía o no configurada.");
                logger.warn("Mensaje preparado para publicar en Tópico SNS y distribuir a colas SQS:");
                logger.warn("{}", jsonPayload);
                logger.warn("--------------------------------------------------------------------------");
                logger.warn("Diagrama de Fan-Out activo:");
                logger.warn("WebPay Pago -> ms-ventas -> Amazon SNS Topic (Topic ARN)");
                logger.warn("                                │");
                logger.warn("          ┌─────────────────────┼─────────────────────┐");
                logger.warn("          ▼                     ▼                     ▼");
                logger.warn("   [SQS Facturación]     [SQS Inventario]      [SQS Despacho]");
                logger.warn("Para publicar en un tópico real, defina 'AWS_SNS_TOPIC_ARN' en application.properties o variables de entorno.");
                logger.warn("==========================================================================");
                return "SIMULATED-SNS-MSG-" + System.currentTimeMillis();
            }

            SnsClient client = getSnsClient();
            if (client == null) {
                logger.warn("[Amazon SNS] Cliente SNS no disponible. Mensaje registrado localmente: {}", jsonPayload);
                return "SNS_CLIENT_UNAVAILABLE";
            }

            Map<String, MessageAttributeValue> messageAttributes = new HashMap<>();
            messageAttributes.put("eventType", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(event.getEventType())
                    .build());
            messageAttributes.put("source", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(event.getSource())
                    .build());
            messageAttributes.put("status", MessageAttributeValue.builder()
                    .dataType("String")
                    .stringValue(event.getStatus())
                    .build());

            PublishRequest publishRequest = PublishRequest.builder()
                    .topicArn(topicArn)
                    .message(jsonPayload)
                    .messageAttributes(messageAttributes)
                    .subject("Pago WebPay Aprobado - Orden " + event.getOrderId())
                    .build();

            PublishResponse response = client.publish(publishRequest);
            logger.info("✔ [Amazon SNS Fan-out] Mensaje de pago WebPay publicado con ÉXITO en Tópico SNS [MessageId: {}]", response.messageId());
            logger.info("  -> SNS propagará automáticamente el mensaje por Fan-out a las colas SQS suscritas.");
            return response.messageId();

        } catch (Exception e) {
            logger.error("⚠ [Amazon SNS] Error al publicar mensaje en el tópico SNS {}: {}", topicArn, e.getMessage());
            // No interrumpimos la experiencia de compra del usuario si AWS no está disponible en demo local
            return "ERROR_SENDING_SNS: " + e.getMessage();
        }
    }
}
