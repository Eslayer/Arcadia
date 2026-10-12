package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.PaymentCompletedSqsEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.SqsClientBuilder;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;

@Service
public class AwsSqsService {

    private static final Logger logger = LoggerFactory.getLogger(AwsSqsService.class);

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.sqs.queue-url:}")
    private String queueUrl;

    @Value("${aws.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:}")
    private String secretAccessKey;

    @Value("${aws.sqs.enabled:true}")
    private boolean sqsEnabled;

    private final ObjectMapper objectMapper;
    private SqsClient sqsClient;

    public AwsSqsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private synchronized SqsClient getSqsClient() {
        if (this.sqsClient != null) {
            return this.sqsClient;
        }

        try {
            SqsClientBuilder builder = SqsClient.builder()
                    .region(Region.of(awsRegion));

            if (accessKeyId != null && !accessKeyId.isBlank() &&
                secretAccessKey != null && !secretAccessKey.isBlank()) {
                builder.credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId.trim(), secretAccessKey.trim())
                ));
            } else {
                builder.credentialsProvider(DefaultCredentialsProvider.create());
            }

            this.sqsClient = builder.build();
            return this.sqsClient;
        } catch (Exception e) {
            logger.warn("No se pudo inicializar SqsClient con credenciales estándar: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Envía un evento de pago completado en WebPay hacia la cola de Amazon SQS.
     *
     * @param event DTO con los detalles de la orden y autorización de WebPay
     * @return El MessageId devuelto por AWS SQS (o un ID de simulación si la cola no está configurada)
     */
    public String sendPaymentCompletedMessage(PaymentCompletedSqsEvent event) {
        if (!sqsEnabled) {
            logger.info("[Amazon SQS] Envío a SQS deshabilitado por configuración (aws.sqs.enabled=false).");
            return "SQS_DISABLED";
        }

        try {
            String jsonPayload = objectMapper.writeValueAsString(event);

            if (queueUrl == null || queueUrl.isBlank()) {
                logger.warn("==========================================================================");
                logger.warn("📦 [AMAZON SQS - MODO EDUCATIVO / SIMULADO]");
                logger.warn("La propiedad 'aws.sqs.queue-url' está vacía o no configurada.");
                logger.warn("Mensaje preparado para la cola SQS:");
                logger.warn("{}", jsonPayload);
                logger.warn("Para enviar a una cola real en AWS, defina 'AWS_SQS_QUEUE_URL' en application.properties o variables de entorno.");
                logger.warn("==========================================================================");
                return "SIMULATED-SQS-MSG-" + System.currentTimeMillis();
            }

            SqsClient client = getSqsClient();
            if (client == null) {
                logger.warn("[Amazon SQS] Cliente SQS no disponible. Mensaje no enviado a la nube pero registrado localmente: {}", jsonPayload);
                return "SQS_CLIENT_UNAVAILABLE";
            }

            SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(jsonPayload)
                    .build();

            SendMessageResponse response = client.sendMessage(sendMessageRequest);
            logger.info("✔ [Amazon SQS] Mensaje de pago WebPay enviado con ÉXITO a la cola SQS [MessageId: {}]", response.messageId());
            return response.messageId();

        } catch (Exception e) {
            logger.error("⚠ [Amazon SQS] Error al enviar mensaje a la cola SQS {}: {}", queueUrl, e.getMessage());
            // No interrumpimos la experiencia de compra del usuario si la red a AWS falla en demo
            return "ERROR_SENDING_SQS: " + e.getMessage();
        }
    }
}
