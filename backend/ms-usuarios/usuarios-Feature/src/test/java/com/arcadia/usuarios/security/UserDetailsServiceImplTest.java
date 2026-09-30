package com.arcadia.usuarios.security;

import com.arcadia.usuarios.model.Usuario;
import com.arcadia.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para UserDetailsServiceImpl")
class UserDetailsServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @DisplayName("Debe cargar un usuario por email si existe")
    void debeCargarUsuarioPorEmailSiExiste() {
        Usuario usuario = new Usuario("1", "Admin", "admin@test.com", "pass123", "ADMIN");
        when(usuarioRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(usuario));

        UserDetails userDetails = userDetailsService.loadUserByUsername("admin@test.com");

        assertNotNull(userDetails);
        assertEquals("admin@test.com", userDetails.getUsername());
        assertEquals("pass123", userDetails.getPassword());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")));
        verify(usuarioRepository, times(1)).findByEmail("admin@test.com");
    }

    @Test
    @DisplayName("Debe lanzar UsernameNotFoundException si el email no existe")
    void debeLanzarExcepcionSiEmailNoExiste() {
        when(usuarioRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("noexiste@test.com"));

        verify(usuarioRepository, times(1)).findByEmail("noexiste@test.com");
    }
}
