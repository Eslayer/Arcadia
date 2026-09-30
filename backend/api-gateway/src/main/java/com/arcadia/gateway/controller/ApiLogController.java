package com.arcadia.gateway.controller;

import com.arcadia.gateway.model.ApiLog;
import com.arcadia.gateway.repository.ApiLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para consultar los logs de acceso al API Manager.
 */
@RestController
@RequestMapping("/api/v1/logs")
@CrossOrigin(origins = "*")
@Tag(name = "Logs de Acceso", description = "Consulta del historial de peticiones procesadas por el API Manager")
public class ApiLogController {

    private final ApiLogRepository apiLogRepository;

    public ApiLogController(ApiLogRepository apiLogRepository) {
        this.apiLogRepository = apiLogRepository;
    }

    @GetMapping
    @Operation(summary = "Listar los últimos 100 logs de acceso")
    public List<ApiLog> obtenerUltimos() {
        return apiLogRepository.findTop100ByOrderByTimestampDesc();
    }

    @GetMapping("/ruta/{patron}")
    @Operation(summary = "Filtrar logs por patrón de ruta (ej: usuarios, comics, ventas)")
    public List<ApiLog> obtenerPorRuta(@PathVariable String patron) {
        return apiLogRepository.findByRoutePatternOrderByTimestampDesc(patron);
    }
}
