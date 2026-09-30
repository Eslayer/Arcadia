package com.arcadia.gateway.controller;

import com.arcadia.gateway.model.ApiKey;
import com.arcadia.gateway.repository.ApiKeyRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controlador REST para la gestión de API Keys.
 * Permite crear, listar, activar/desactivar y eliminar claves de acceso.
 */
@RestController
@RequestMapping("/api/v1/keys")
@CrossOrigin(origins = "*")
@Tag(name = "Gestión de API Keys", description = "Endpoints para administrar las llaves de acceso de clientes")
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyController(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @GetMapping
    @Operation(summary = "Listar todas las API Keys")
    public List<ApiKey> obtenerTodas() {
        return apiKeyRepository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una API Key por ID")
    public ResponseEntity<ApiKey> obtenerPorId(@PathVariable Long id) {
        return apiKeyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Crear nueva API Key (se genera automáticamente)")
    public ResponseEntity<ApiKey> crear(@Valid @RequestBody ApiKey apiKey) {
        // Si no se provee keyString, se genera uno único con UUID
        if (apiKey.getKeyString() == null || apiKey.getKeyString().isBlank()) {
            apiKey.setKeyString("arcadia-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        }
        if (apiKeyRepository.existsByKeyString(apiKey.getKeyString())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        ApiKey guardada = apiKeyRepository.save(apiKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar datos de una API Key")
    public ResponseEntity<ApiKey> actualizar(@PathVariable Long id, @Valid @RequestBody ApiKey datosActualizados) {
        return apiKeyRepository.findById(id).map(key -> {
            key.setOwnerName(datosActualizados.getOwnerName());
            key.setActive(datosActualizados.isActive());
            key.setRateLimitPerMinute(datosActualizados.getRateLimitPerMinute());
            return ResponseEntity.ok(apiKeyRepository.save(key));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Activar o desactivar una API Key")
    public ResponseEntity<ApiKey> toggleEstado(@PathVariable Long id) {
        return apiKeyRepository.findById(id).map(key -> {
            key.setActive(!key.isActive());
            return ResponseEntity.ok(apiKeyRepository.save(key));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una API Key")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!apiKeyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        apiKeyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
