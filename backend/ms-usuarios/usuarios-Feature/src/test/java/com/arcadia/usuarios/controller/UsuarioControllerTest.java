package com.arcadia.usuarios.controller;

import com.arcadia.usuarios.model.Usuario;
import com.arcadia.usuarios.security.JwtAuthFilter;
import com.arcadia.usuarios.security.UserDetailsServiceImpl;
import com.arcadia.usuarios.service.UsuarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UsuarioController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests para UsuarioController")
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UsuarioService usuarioService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private Usuario usuarioTest;

    @BeforeEach
    void setUp() {
        usuarioTest = new Usuario(
                "1",
                "Juan Pérez",
                "juan@test.com",
                "password123",
                "Cliente"
        );
    }

    @Test
    @DisplayName("POST /registro - Debe registrar un usuario exitosamente")
    void debeRegistrarUsuarioExitosamente() throws Exception {
        when(usuarioService.registrar(any(Usuario.class))).thenReturn(usuarioTest);

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usuarioTest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.nombre").value("Juan Pérez"))
                .andExpect(jsonPath("$.email").value("juan@test.com"))
                .andExpect(jsonPath("$.password").isEmpty()); // Se verifica que la contraseña es nula en el response

        verify(usuarioService, times(1)).registrar(any(Usuario.class));
    }

    @Test
    @DisplayName("POST /registro - Debe retornar conflicto cuando falla el registro")
    void debeRetornarConflictoAlRegistrar() throws Exception {
        when(usuarioService.registrar(any(Usuario.class))).thenThrow(new RuntimeException("El email ya está registrado"));

        mockMvc.perform(post("/api/usuarios/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usuarioTest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("El email ya está registrado"));
    }

    @Test
    @DisplayName("POST /login - Debe autenticar exitosamente")
    void debeLoguearExitosamente() throws Exception {
        Map<String, Object> response = Map.of(
                "token", "eyJhbGci.payload.signature",
                "tipo", "Bearer",
                "userId", "1",
                "rol", "Cliente"
        );
        when(usuarioService.login("juan@test.com", "password123")).thenReturn(Optional.of(response));

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "juan@test.com", "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("eyJhbGci.payload.signature"))
                .andExpect(jsonPath("$.rol").value("Cliente"));
    }

    @Test
    @DisplayName("POST /login - Debe retornar no autorizado con credenciales inválidas")
    void debeRetornarNoAutorizadoAlLoguear() throws Exception {
        when(usuarioService.login("juan@test.com", "wrong")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "juan@test.com", "password", "wrong"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Credenciales inválidas"));
    }

    @Test
    @DisplayName("GET /health - Debe retornar UP")
    void debeRetornarHealthCheck() throws Exception {
        mockMvc.perform(get("/api/usuarios/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("GET / - Debe obtener todos los usuarios")
    void debeObtenerTodosLosUsuarios() throws Exception {
        when(usuarioService.obtenerTodos()).thenReturn(Arrays.asList(usuarioTest));

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Juan Pérez"))
                .andExpect(jsonPath("$[0].password").isEmpty());
    }

    @Test
    @DisplayName("GET /{id} - Debe obtener usuario por ID")
    void debeObtenerPorId() throws Exception {
        when(usuarioService.obtenerPorId("1")).thenReturn(Optional.of(usuarioTest));

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Juan Pérez"));
    }

    @Test
    @DisplayName("GET /{id} - Debe retornar NOT FOUND cuando no existe ID")
    void debeRetornarNotFoundAlObtenerPorId() throws Exception {
        when(usuarioService.obtenerPorId("99")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/usuarios/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /email/{email} - Debe obtener usuario por Email")
    void debeObtenerPorEmail() throws Exception {
        Usuario mockUser = new Usuario("1", "Juan", "juan@test.com", "pass", "Cliente");
        when(usuarioService.obtenerPorEmail("juan@test.com")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(get("/api/usuarios/email/juan@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Juan"));
    }

    @Test
    @DisplayName("GET /email/{email} - Debe retornar NOT FOUND cuando no existe Email")
    void debeRetornarNotFoundAlObtenerPorEmail() throws Exception {
        when(usuarioService.obtenerPorEmail("no@test.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/usuarios/email/no@test.com"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /{id} - Debe actualizar usuario exitosamente")
    void debeActualizarUsuarioExitosamente() throws Exception {
        when(usuarioService.actualizar(eq("1"), any(Usuario.class))).thenReturn(usuarioTest);

        mockMvc.perform(put("/api/usuarios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usuarioTest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Juan Pérez"));
    }

    @Test
    @DisplayName("PUT /{id} - Debe retornar NOT FOUND si el usuario a actualizar no existe")
    void debeRetornarNotFoundAlActualizar() throws Exception {
        when(usuarioService.actualizar(eq("99"), any(Usuario.class))).thenThrow(new RuntimeException("No encontrado"));

        mockMvc.perform(put("/api/usuarios/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(usuarioTest)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /{id}/rol - Debe actualizar el rol")
    void debeActualizarRolExitosamente() throws Exception {
        when(usuarioService.actualizarRol("1", "ADMIN")).thenReturn(usuarioTest);

        mockMvc.perform(put("/api/usuarios/1/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rol", "ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /{id}/rol - Debe retornar BAD REQUEST si el rol es inválido")
    void debeRetornarBadRequestSiRolInvalido() throws Exception {
        mockMvc.perform(put("/api/usuarios/1/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rol", "INVITADO"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /{id}/rol - Debe retornar NOT FOUND si no se encuentra el usuario")
    void debeRetornarNotFoundAlActualizarRol() throws Exception {
        when(usuarioService.actualizarRol("99", "ADMIN")).thenThrow(new RuntimeException("No existe"));

        mockMvc.perform(put("/api/usuarios/99/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rol", "ADMIN"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /{id} - Debe eliminar un usuario")
    void debeEliminarExitosamente() throws Exception {
        doNothing().when(usuarioService).eliminar("1");

        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /{id} - Debe retornar NOT FOUND al eliminar si no existe")
    void debeRetornarNotFoundAlEliminar() throws Exception {
        doThrow(new RuntimeException("No existe")).when(usuarioService).eliminar("99");

        mockMvc.perform(delete("/api/usuarios/99"))
                .andExpect(status().isNotFound());
    }
}
