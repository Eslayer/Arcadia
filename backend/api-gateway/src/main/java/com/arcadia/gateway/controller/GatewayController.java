package com.arcadia.gateway.controller;

import com.arcadia.gateway.model.ApiKey;
import com.arcadia.gateway.model.ApiRoute;
import com.arcadia.gateway.repository.ApiKeyRepository;
import com.arcadia.gateway.repository.ApiRouteRepository;
import com.arcadia.gateway.service.ProxyService;
import com.arcadia.gateway.service.RateLimiterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Controlador principal del Gateway (Proxy).
 * Recibe todas las peticiones de los frontends en /api/{patron}/**,
 * valida la API Key, aplica rate limiting y reenvía al microservicio destino.
 *
 * Rutas soportadas:
 *   - /api/usuarios/**  → ms-usuarios (8085)
 *   - /api/comics/**    → ms-comics   (8081)
 *   - /orders/**        → ms-ventas   (8082)  ← mapeado desde el frontend con VITE_VENTAS_API_URL
 */
@RestController
@CrossOrigin(origins = "*")
@Tag(name = "Gateway Proxy", description = "Punto de entrada que enruta peticiones a los microservicios de Arcadia")
public class GatewayController {

    private final ApiRouteRepository routeRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final RateLimiterService rateLimiterService;
    private final ProxyService proxyService;

    public GatewayController(ApiRouteRepository routeRepository,
                             ApiKeyRepository apiKeyRepository,
                             RateLimiterService rateLimiterService,
                             ProxyService proxyService) {
        this.routeRepository = routeRepository;
        this.apiKeyRepository = apiKeyRepository;
        this.rateLimiterService = rateLimiterService;
        this.proxyService = proxyService;
    }

    /**
     * Endpoint principal del proxy.
     * Intercepta cualquier petición en /api/{patron}/** o /orders/**.
     *
     * El frontend envía el header X-API-Key con su clave de acceso.
     * Si no se envía, se intenta un acceso libre (solo si la ruta lo permite).
     */
    @RequestMapping(value = {"/api/{patron}/**", "/orders/**"})
    @Operation(summary = "Proxy Gateway: enruta peticiones a los microservicios registrados")
    public ResponseEntity<?> proxy(
            @PathVariable(required = false) String patron,
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            HttpServletRequest request) {

        // ---- 1. Determinar el patrón de ruta desde la URI ----
        String uri = request.getRequestURI();
        String patronDetectado = detectarPatron(uri, patron);

        if (patronDetectado == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\": \"No se pudo determinar el patrón de ruta\"}");
        }

        // ---- 2. Buscar la ruta registrada en el API Manager ----
        Optional<ApiRoute> rutaOpt = routeRepository.findByPathPatternAndEnabledTrue(patronDetectado);
        if (rutaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\": \"Ruta '" + patronDetectado + "' no encontrada o deshabilitada en el API Manager\"}");
        }
        ApiRoute ruta = rutaOpt.get();

        // ---- 3. Validar API Key (si se envía) ----
        String claveParaRateLimit = request.getRemoteAddr(); // por defecto: limitar por IP
        if (apiKey != null && !apiKey.isBlank()) {
            Optional<ApiKey> keyOpt = apiKeyRepository.findByKeyStringAndActiveTrue(apiKey);
            if (keyOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\": \"API Key inválida o desactivada\"}");
            }
            claveParaRateLimit = apiKey;
            // Rate limit según la key
            int limiteKey = keyOpt.get().getRateLimitPerMinute();
            if (!rateLimiterService.estaPermitido(claveParaRateLimit, limiteKey)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\": \"Límite de peticiones por minuto superado para la API Key\"}");
            }
        } else {
            // Sin API Key: rate limit por IP según el límite de la ruta
            if (!rateLimiterService.estaPermitido(claveParaRateLimit, ruta.getRateLimitPerMinute())) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\": \"Límite de peticiones por minuto superado para esta IP\"}");
            }
        }

        // ---- 4. Calcular ruta restante para reenviar al microservicio ----
        String prefijo = construirPrefijo(patronDetectado);
        String rutaRestante = uri.substring(prefijo.length());

        // ---- 5. Reenviar petición al microservicio destino ----
        return proxyService.reenviarPeticion(ruta, rutaRestante, request, apiKey != null ? apiKey : "sin-key");
    }

    /**
     * Detecta el patrón de ruta desde la URI de la petición.
     * Ejemplo: /api/usuarios/1 → "usuarios"
     *          /api/comics     → "comics"
     *          /orders/123     → "ventas"
     */
    private String detectarPatron(String uri, String patronVariable) {
        if (uri.startsWith("/orders")) {
            return "ventas";
        }
        if (uri.startsWith("/api/") && patronVariable != null) {
            return patronVariable;
        }
        return null;
    }

    /**
     * Construye el prefijo de la URI que corresponde al patrón,
     * para calcular la ruta restante que se enviará al microservicio.
     */
    private String construirPrefijo(String patron) {
        if ("ventas".equals(patron)) {
            return "/orders";
        }
        return "/api/" + patron;
    }
}
