package com.arcadia.gateway.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Servicio de Rate Limiting basado en ventana de tiempo de 1 minuto.
 * Usa una ventana deslizante por clave (apiKey o IP) en memoria.
 */
@Service
public class RateLimiterService {

    private static class VentanaRequest {
        long inicioVentanaMs;
        AtomicInteger contador;

        VentanaRequest(long inicioVentanaMs) {
            this.inicioVentanaMs = inicioVentanaMs;
            this.contador = new AtomicInteger(1);
        }
    }

    // Mapa de clave -> ventana de conteo
    private final Map<String, VentanaRequest> ventanas = new ConcurrentHashMap<>();

    /**
     * Verifica si la clave dada supera el límite de peticiones por minuto.
     *
     * @param clave            Identificador único (apiKey o IP)
     * @param limitePerMinuto  Número máximo de peticiones permitidas por minuto
     * @return true si está dentro del límite, false si lo supera
     */
    public boolean estaPermitido(String clave, int limitePerMinuto) {
        long ahora = System.currentTimeMillis();
        long unMinutoMs = 60_000L;

        VentanaRequest ventana = ventanas.get(clave);

        if (ventana == null || (ahora - ventana.inicioVentanaMs) > unMinutoMs) {
            // Nueva ventana de tiempo
            ventanas.put(clave, new VentanaRequest(ahora));
            return true;
        }

        int total = ventana.contador.incrementAndGet();
        return total <= limitePerMinuto;
    }
}
