package com.arcadia.usuarios.dto;

import com.arcadia.usuarios.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Evento publicado en Amazon Kinesis Data Streams al registrar un nuevo usuario.
 * Amazon Data Firehose consume este stream para entregarlo a su destino en AWS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCreadoEvent {

    @Builder.Default
    private String eventType = "USER_CREATED";

    @Builder.Default
    private String source = "ms-usuarios";

    private String userId;
    private String nombre;
    private String email;
    private String rol;
    private String fechaRegistro;
    private String timestamp;

    public static UsuarioCreadoEvent fromUsuario(Usuario usuario) {
        return UsuarioCreadoEvent.builder()
                .eventType("USER_CREATED")
                .source("ms-usuarios")
                .userId(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .fechaRegistro(usuario.getFechaRegistro() != null
                        ? usuario.getFechaRegistro().toString()
                        : null)
                .timestamp(Instant.now().toString())
                .build();
    }
}
