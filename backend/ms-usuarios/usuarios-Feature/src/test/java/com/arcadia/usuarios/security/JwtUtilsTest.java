package com.arcadia.usuarios.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para JwtUtils")
class JwtUtilsTest {

    private JwtUtils jwtUtils;
    // Un secreto en Base64 válido de al menos 256 bits (32 bytes)
    // El texto plano es "ArcadiaSuperSecretKey1234567890!ArcadiaSecret"
    private final String secretBase64 = "QXJjYWRpYVN1cGVyU2VjcmV0S2V5MTIzNDU2Nzg5MCFBcmNhZGlhU2VjcmV0";
    private final long expirationMs = 60000; // 1 minuto

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils(secretBase64, expirationMs);
    }

    @Test
    @DisplayName("Debe generar un token válido y poder extraer la información correcta")
    void debeGenerarTokenYExtraerDatos() {
        String token = jwtUtils.generarToken("juan@test.com", "Cliente", "1");

        assertNotNull(token);
        assertTrue(jwtUtils.validarToken(token));
        assertEquals("juan@test.com", jwtUtils.getEmailDesdeToken(token));
    }

    @Test
    @DisplayName("Debe retornar false al validar un token con firma inválida")
    void debeRetornarFalseConFirmaInvalida() {
        String token = jwtUtils.generarToken("juan@test.com", "Cliente", "1");
        String tokenInvalido = token + "modified";

        assertFalse(jwtUtils.validarToken(tokenInvalido));
    }

    @Test
    @DisplayName("Debe retornar false al validar un token expirado")
    void debeRetornarFalseConTokenExpirado() {
        // Inicializar JwtUtils con expiración de -1000 ms (ya expirado desde su creación)
        JwtUtils jwtUtilsExpirado = new JwtUtils(secretBase64, -1000);
        String tokenExpirado = jwtUtilsExpirado.generarToken("juan@test.com", "Cliente", "1");

        assertFalse(jwtUtilsExpirado.validarToken(tokenExpirado));
    }

    @Test
    @DisplayName("Debe retornar false al validar un token con estructura completamente inválida")
    void debeRetornarFalseConTokenMalformado() {
        assertFalse(jwtUtils.validarToken("malformed.token.here"));
    }
}
