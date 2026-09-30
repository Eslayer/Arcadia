package com.arcadia.gateway.config;

import com.arcadia.gateway.model.ApiKey;
import com.arcadia.gateway.model.ApiRoute;
import com.arcadia.gateway.repository.ApiKeyRepository;
import com.arcadia.gateway.repository.ApiRouteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializador de datos de ejemplo para el API Manager.
 * Al arrancar, registra las 3 rutas de Arcadia y una API Key de prueba
 * (solo si la base de datos está vacía).
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final ApiRouteRepository routeRepository;
    private final ApiKeyRepository apiKeyRepository;

    public DataInitializer(ApiRouteRepository routeRepository, ApiKeyRepository apiKeyRepository) {
        this.routeRepository = routeRepository;
        this.apiKeyRepository = apiKeyRepository;
    }

    @Override
    public void run(String... args) {

        // ---- Registrar rutas de los microservicios de Arcadia ----
        if (routeRepository.count() == 0) {
            routeRepository.save(new ApiRoute(
                    "Microservicio Usuarios",
                    "usuarios",
                    "http://localhost:8085/api/usuarios",
                    true,
                    120
            ));
            routeRepository.save(new ApiRoute(
                    "Microservicio Comics",
                    "comics",
                    "http://localhost:8081/api/comics",
                    true,
                    120
            ));
            routeRepository.save(new ApiRoute(
                    "Microservicio Ventas",
                    "ventas",
                    "http://localhost:8082/orders",
                    true,
                    60
            ));
            System.out.println("✔ Rutas de Arcadia registradas: usuarios, comics, ventas con sus endpoints base");
        }

        // ---- Registrar API Key de prueba ----
        if (apiKeyRepository.count() == 0) {
            apiKeyRepository.save(new ApiKey(
                    "arcadia-dev-key-2024",
                    "Equipo Desarrollo Arcadia",
                    200
            ));
            apiKeyRepository.save(new ApiKey(
                    "arcadia-frontend-key",
                    "Frontend Admin Panel",
                    100
            ));
            System.out.println("✔ API Keys de prueba creadas");
        }
    }
}
