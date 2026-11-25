package com.arcadia.usuarios.service;

import com.arcadia.usuarios.dto.UsuarioCreadoEvent;
import com.arcadia.usuarios.model.Usuario;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.kinesis.KinesisClient;
import software.amazon.awssdk.services.kinesis.model.PutRecordRequest;
import software.amazon.awssdk.services.kinesis.model.PutRecordResponse;

/**
 * Servicio encargado de enviar eventos de usuarios a Amazon Kinesis Data Streams.
 * Opera en modo best-effort para que un fallo o falta de credenciales AWS no
 * interrumpa el registro de usuarios en la base de datos.
 */
@Service
@Slf4j
public class AwsKinesisService {

    private final KinesisClient kinesisClient;
    private final ObjectMapper objectMapper;
    private final String streamName;
    private final boolean kinesisEnabled;

    public AwsKinesisService(
            KinesisClient kinesisClient,
            ObjectMapper objectMapper,
            @Value("${aws.kinesis.stream-name:}") String streamName,
            @Value("${aws.kinesis.enabled:true}") boolean kinesisEnabled) {
        this.kinesisClient = kinesisClient;
        this.objectMapper = objectMapper;
        this.streamName = streamName;
        this.kinesisEnabled = kinesisEnabled;
    }

    /**
     * Publica un evento USER_CREATED en el Kinesis Data Stream configurado.
     *
     * @param usuario Usuario recién persistido en base de datos
     * @return SequenceNumber retornado por Kinesis, o un identificador de estado si fue omitido/falló
     */
    public String publishUsuarioCreado(Usuario usuario) {
        if (!kinesisEnabled) {
            log.info("[Amazon Kinesis] Publicación deshabilitada (aws.kinesis.enabled=false).");
            return "KINESIS_DISABLED";
        }

        if (usuario == null) {
            log.warn("[Amazon Kinesis] Se intentó publicar un evento con usuario nulo.");
            return "INVALID_USER";
        }

        try {
            UsuarioCreadoEvent event = UsuarioCreadoEvent.fromUsuario(usuario);
            String jsonPayload = objectMapper.writeValueAsString(event);

            if (streamName == null || streamName.isBlank()) {
                log.warn("[Amazon Kinesis] 'aws.kinesis.stream-name' no configurado. "
                        + "Evento preparado (no enviado a AWS): {}", jsonPayload);
                return "SIMULATED-KINESIS-" + System.currentTimeMillis();
            }

            String partitionKey = (usuario.getId() != null && !usuario.getId().isBlank())
                    ? usuario.getId()
                    : usuario.getEmail();

            // Se agrega '\n' para facilitar el procesamiento NDJSON cuando Firehose entrega a S3.
            PutRecordRequest request = PutRecordRequest.builder()
                    .streamName(streamName.trim())
                    .partitionKey(partitionKey)
                    .data(SdkBytes.fromUtf8String(jsonPayload + "\n"))
                    .build();

            PutRecordResponse response = kinesisClient.putRecord(request);
            log.info("[Amazon Kinesis] Evento USER_CREATED enviado al stream '{}' [ShardId: {}, SequenceNumber: {}]",
                    streamName.trim(), response.shardId(), response.sequenceNumber());
            return response.sequenceNumber();

        } catch (AwsServiceException e) {
            String code = e.awsErrorDetails() != null && e.awsErrorDetails().errorCode() != null
                    ? e.awsErrorDetails().errorCode()
                    : e.getClass().getSimpleName();
            log.warn("[Amazon Kinesis] AWS rechazó PutRecord en stream '{}' (código={}, requestId={}): {}",
                    streamName, code, e.requestId(), e.getMessage());
            return "ERROR_AWS_" + code;
        } catch (SdkException e) {
            log.warn("[Amazon Kinesis] No se pudo conectar con AWS Kinesis para stream '{}': {}",
                    streamName, e.getMessage());
            return "ERROR_SDK";
        } catch (JsonProcessingException e) {
            log.error("[Amazon Kinesis] Error serializando evento USER_CREATED para usuario {}: {}",
                    usuario.getEmail(), e.getMessage());
            return "ERROR_SERIALIZATION";
        }
    }
}
