package com.arcadia.gateway.controller;

import com.arcadia.gateway.model.ApiRoute;
import com.arcadia.gateway.repository.ApiRouteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión de rutas registradas en el API Manager.
 * Permite registrar, actualizar, activar/desactivar y eliminar rutas de microservicios.
 */
@RestController
@RequestMapping("/api/v1/routes")
@CrossOrigin(origins = "*")
@Tag(name = "Administración de Rutas", description = "CRUD para la gestión de las APIs registradas en el Manager")
public class ApiRouteController {

    private final ApiRouteRepository routeRepository;

    public ApiRouteController(ApiRouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @GetMapping
    @Operation(summary = "Listar todas las rutas registradas")
    public List<ApiRoute> obtenerTodas() {
        return routeRepository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una ruta por ID")
    public ResponseEntity<ApiRoute> obtenerPorId(@PathVariable Long id) {
        return routeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Registrar una nueva ruta de microservicio")
    public ResponseEntity<ApiRoute> crear(@Valid @RequestBody ApiRoute ruta) {
        if (routeRepository.findByPathPattern(ruta.getPathPattern()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        ApiRoute guardada = routeRepository.save(ruta);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una ruta existente")
    public ResponseEntity<ApiRoute> actualizar(@PathVariable Long id, @Valid @RequestBody ApiRoute datosActualizados) {
        return routeRepository.findById(id).map(ruta -> {
            ruta.setName(datosActualizados.getName());
            ruta.setPathPattern(datosActualizados.getPathPattern());
            ruta.setTargetUrl(datosActualizados.getTargetUrl());
            ruta.setEnabled(datosActualizados.isEnabled());
            ruta.setRateLimitPerMinute(datosActualizados.getRateLimitPerMinute());
            return ResponseEntity.ok(routeRepository.save(ruta));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Activar o desactivar una ruta")
    public ResponseEntity<ApiRoute> toggleEstado(@PathVariable Long id) {
        return routeRepository.findById(id).map(ruta -> {
            ruta.setEnabled(!ruta.isEnabled());
            return ResponseEntity.ok(routeRepository.save(ruta));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar una ruta registrada")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!routeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        routeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
