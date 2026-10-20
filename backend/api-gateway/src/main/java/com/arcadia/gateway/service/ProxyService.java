package com.arcadia.gateway.service;

import com.arcadia.gateway.model.ApiLog;
import com.arcadia.gateway.model.ApiRoute;
import com.arcadia.gateway.repository.ApiLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Enumeration;

import java.io.IOException;
import java.net.HttpURLConnection;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

/**
 * Servicio Proxy que reenvía las peticiones HTTP al microservicio destino
 * y registra un log de cada llamada.
 */
@Service
public class ProxyService {

    private final ApiLogRepository apiLogRepository;
    private final RestTemplate restTemplate;

    public ProxyService(ApiLogRepository apiLogRepository) {
    this.apiLogRepository = apiLogRepository;

    SimpleClientHttpRequestFactory factory =
        new SimpleClientHttpRequestFactory() {
            @Override
            protected void prepareConnection(
                HttpURLConnection connection,
                String httpMethod
            ) throws IOException {
                super.prepareConnection(connection, httpMethod);
                connection.setInstanceFollowRedirects(false);
            }
        };

    this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Reenvía la petición entrante al servicio destino registrado en la ruta.
     *
     * @param ruta          Ruta registrada en el API Manager
     * @param rutaRestante  Segmento de ruta adicional tras el patrón
     * @param request       Petición HTTP original del cliente
     * @param apiKeyUsada   Clave API usada por el cliente
     * @return ResponseEntity con la respuesta del microservicio destino
     */
    public ResponseEntity<byte[]> reenviarPeticion(ApiRoute ruta, String rutaRestante,
                                                    HttpServletRequest request, String apiKeyUsada) {
        long inicio = System.currentTimeMillis();
        int statusCode = 500;
        byte[] cuerpoRespuesta = new byte[0];
        HttpHeaders headersRespuesta = new HttpHeaders();

        // Construir URL destino
        String urlDestino = ruta.getTargetUrl();
        if (!urlDestino.endsWith("/") && rutaRestante != null
                && !rutaRestante.startsWith("/") && !rutaRestante.isEmpty()) {
            urlDestino += "/";
        }
        if (rutaRestante != null && !rutaRestante.isEmpty()) {
            urlDestino += rutaRestante;
        }

        // Agregar query string si existe
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isEmpty()) {
            urlDestino += "?" + queryString;
        }

        // Copiar headers del request original (excepto host)
        HttpHeaders headersRequest = new HttpHeaders();
        Enumeration<String> nombreHeaders = request.getHeaderNames();
        if (nombreHeaders != null) {
            while (nombreHeaders.hasMoreElements()) {
                String nombre = nombreHeaders.nextElement();
                if (!nombre.equalsIgnoreCase("host")) {
                    headersRequest.put(nombre, Collections.list(request.getHeaders(nombre)));
                }
            }
        }

        try {
            // Leer cuerpo del request
            byte[] cuerpoRequest = request.getInputStream().readAllBytes();

            HttpEntity<byte[]> entidad = new HttpEntity<>(cuerpoRequest.length > 0 ? cuerpoRequest : null, headersRequest);
            HttpMethod metodo = HttpMethod.valueOf(request.getMethod());

            ResponseEntity<byte[]> respuesta = restTemplate.exchange(
                    urlDestino, metodo, entidad, byte[].class
            );

            statusCode = respuesta.getStatusCode().value();
            if (respuesta.getBody() != null) {
                cuerpoRespuesta = respuesta.getBody();
            }
            headersRespuesta = respuesta.getHeaders();

        } catch (HttpStatusCodeException e) {
            statusCode = e.getStatusCode().value();
            cuerpoRespuesta = e.getResponseBodyAsByteArray();
        } catch (Exception e) {
            statusCode = 502;
            String mensajeError = "{\"error\": \"Error al conectar con el servicio destino: " + e.getMessage() + "\"}";
            cuerpoRespuesta = mensajeError.getBytes();
        } finally {
            long tiempoEjecucion = System.currentTimeMillis() - inicio;
            // Registrar log de la llamada
            ApiLog log = new ApiLog(
                    ruta.getPathPattern(),
                    request.getRequestURI(),
                    urlDestino,
                    request.getMethod(),
                    statusCode,
                    tiempoEjecucion,
                    request.getRemoteAddr(),
                    apiKeyUsada
            );
            apiLogRepository.save(log);
        }

        // Construir headers de respuesta (eliminar transfer-encoding para evitar problemas)
        HttpHeaders headersFinales = new HttpHeaders();
        headersRespuesta.forEach((nombre, valores) -> {
            if (!nombre.equalsIgnoreCase("transfer-encoding")) {
                headersFinales.put(nombre, valores);
            }
        });
        // Agregar CORS
        headersFinales.add("Access-Control-Allow-Origin", "*");

        return new ResponseEntity<>(cuerpoRespuesta, headersFinales, HttpStatusCode.valueOf(statusCode));
    }
}
