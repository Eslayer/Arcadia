package com.arcadia.usuarios.service;

import com.arcadia.usuarios.model.Usuario;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.kinesis.KinesisClient;
import software.amazon.awssdk.services.kinesis.model.PutRecordRequest;
import software.amazon.awssdk.services.kinesis.model.PutRecordResponse;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para AwsKinesisService")
class AwsKinesisServiceTest {

    @Mock
    private KinesisClient kinesisClient;

    private ObjectMapper objectMapper;
    private Usuario usuarioTest;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        usuarioTest = new Usuario(
                "user-123",
                "Juan Pérez",
                "juan@test.com",
                "$2a$10$hashedSecretPassword",
                "Cliente"
        );
        usuarioTest.setFechaRegistro(LocalDateTime.of(2026, 11, 25, 0, 30, 0));
    }

    @Test
    @DisplayName("Debe enviar evento USER_CREATED a Kinesis sin incluir password")
    void debeEnviarEventoAKinesisSinPassword() throws Exception {
        AwsKinesisService service = new AwsKinesisService(
                kinesisClient, objectMapper, "arcadia-usuarios-stream", true);

        when(kinesisClient.putRecord(any(PutRecordRequest.class)))
                .thenReturn(PutRecordResponse.builder()
                        .shardId("shardId-000000000000")
                        .sequenceNumber("49650000000000000001")
                        .build());

        String result = service.publishUsuarioCreado(usuarioTest);

        assertEquals("49650000000000000001", result);

        ArgumentCaptor<PutRecordRequest> captor = ArgumentCaptor.forClass(PutRecordRequest.class);
        verify(kinesisClient, times(1)).putRecord(captor.capture());

        PutRecordRequest sent = captor.getValue();
        assertEquals("arcadia-usuarios-stream", sent.streamName());
        assertEquals("user-123", sent.partitionKey());

        String rawPayload = sent.data().asUtf8String();
        assertTrue(rawPayload.endsWith("\n"), "Debe terminar en salto de línea para NDJSON en Firehose");
        assertFalse(rawPayload.contains("hashedSecretPassword"), "No debe exponer la contraseña");

        JsonNode json = objectMapper.readTree(rawPayload);
        assertEquals("USER_CREATED", json.get("eventType").asText());
        assertEquals("ms-usuarios", json.get("source").asText());
        assertEquals("user-123", json.get("userId").asText());
        assertEquals("Juan Pérez", json.get("nombre").asText());
        assertEquals("juan@test.com", json.get("email").asText());
        assertEquals("Cliente", json.get("rol").asText());
        assertTrue(json.path("password").isMissingNode());
    }

    @Test
    @DisplayName("No debe llamar a Kinesis cuando está deshabilitado")
    void noDebeEnviarSiEstaDeshabilitado() {
        AwsKinesisService service = new AwsKinesisService(
                kinesisClient, objectMapper, "arcadia-usuarios-stream", false);

        String result = service.publishUsuarioCreado(usuarioTest);

        assertEquals("KINESIS_DISABLED", result);
        verifyNoInteractions(kinesisClient);
    }

    @Test
    @DisplayName("No debe llamar a Kinesis cuando stream-name está vacío")
    void noDebeEnviarSiStreamNameVacio() {
        AwsKinesisService service = new AwsKinesisService(
                kinesisClient, objectMapper, "   ", true);

        String result = service.publishUsuarioCreado(usuarioTest);

        assertTrue(result.startsWith("SIMULATED-KINESIS-"));
        verifyNoInteractions(kinesisClient);
    }

    @Test
    @DisplayName("Debe operar best-effort y no lanzar excepción ante AwsServiceException")
    void noDebeLanzarExcepcionAnteAwsServiceException() {
        AwsKinesisService service = new AwsKinesisService(
                kinesisClient, objectMapper, "arcadia-usuarios-stream", true);

        AwsServiceException awsError = AwsServiceException.builder()
                .message("Stream not found")
                .requestId("req-123")
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode("ResourceNotFoundException")
                        .errorMessage("Stream not found")
                        .build())
                .build();

        when(kinesisClient.putRecord(any(PutRecordRequest.class))).thenThrow(awsError);

        String result = assertDoesNotThrow(() -> service.publishUsuarioCreado(usuarioTest));
        assertEquals("ERROR_AWS_ResourceNotFoundException", result);
    }

    @Test
    @DisplayName("Debe operar best-effort y no lanzar excepción ante SdkClientException")
    void noDebeLanzarExcepcionAnteSdkClientException() {
        AwsKinesisService service = new AwsKinesisService(
                kinesisClient, objectMapper, "arcadia-usuarios-stream", true);

        when(kinesisClient.putRecord(any(PutRecordRequest.class)))
                .thenThrow(SdkClientException.create("Unable to load credentials"));

        String result = assertDoesNotThrow(() -> service.publishUsuarioCreado(usuarioTest));
        assertEquals("ERROR_SDK", result);
    }
}
