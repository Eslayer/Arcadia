package com.arcadia.comics.controller;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.service.ComicService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ComicController.class)
@DisplayName("Tests para ComicController")
class ComicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ComicService comicService;

    private Comic comicTest;

    @BeforeEach
    void setUp() {
        comicTest = new Comic(
                "123-abc",
                "Spiderman: Blue",
                "Jeph Loeb",
                "Marvel Comics",
                19.99,
                10,
                "http://image.url/spiderman_blue.jpg",
                "A sweet and sad story about Spiderman.",
                "2002-07-01",
                "Superhero",
                144,
                "English"
        );
    }

    @Test
    @DisplayName("GET /api/comics - Debe obtener todos los cómics")
    void debeObtenerTodosLosComics() throws Exception {
        when(comicService.getAllComics()).thenReturn(Arrays.asList(comicTest));

        mockMvc.perform(get("/api/comics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("123-abc"))
                .andExpect(jsonPath("$[0].title").value("Spiderman: Blue"))
                .andExpect(jsonPath("$[0].author").value("Jeph Loeb"));

        verify(comicService, times(1)).getAllComics();
    }

    @Test
    @DisplayName("GET /api/comics - Debe retornar lista vacía si no hay cómics")
    void debeRetornarListaVaciaSiNoHayComics() throws Exception {
        when(comicService.getAllComics()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/comics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(comicService, times(1)).getAllComics();
    }

    @Test
    @DisplayName("GET /api/comics/{id} - Debe obtener un cómic por su ID si existe")
    void debeObtenerComicPorIdSiExiste() throws Exception {
        when(comicService.getComicById("123-abc")).thenReturn(Optional.of(comicTest));

        mockMvc.perform(get("/api/comics/123-abc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("123-abc"))
                .andExpect(jsonPath("$.title").value("Spiderman: Blue"));

        verify(comicService, times(1)).getComicById("123-abc");
    }

    @Test
    @DisplayName("GET /api/comics/{id} - Debe retornar NOT FOUND si el cómic no existe")
    void debeRetornarNotFoundAlObtenerPorId() throws Exception {
        when(comicService.getComicById("non-existent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/comics/non-existent"))
                .andExpect(status().isNotFound());

        verify(comicService, times(1)).getComicById("non-existent");
    }

    @Test
    @DisplayName("POST /api/comics - Debe crear un cómic exitosamente")
    void debeCrearComicExitosamente() throws Exception {
        when(comicService.createComic(any(Comic.class))).thenReturn(comicTest);

        mockMvc.perform(post("/api/comics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(comicTest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("123-abc"))
                .andExpect(jsonPath("$.title").value("Spiderman: Blue"));

        verify(comicService, times(1)).createComic(any(Comic.class));
    }

    @Test
    @DisplayName("PUT /api/comics/{id} - Debe actualizar un cómic exitosamente")
    void debeActualizarComicExitosamente() throws Exception {
        Comic updatedComic = new Comic(
                "123-abc",
                "Spiderman: Blue - Deluxe Edition",
                "Jeph Loeb",
                "Marvel Comics",
                24.99,
                10,
                "http://image.url/spiderman_blue_deluxe.jpg",
                "A sweet and sad story about Spiderman.",
                "2002-07-01",
                "Superhero",
                144,
                "English"
        );
        when(comicService.updateComic(eq("123-abc"), any(Comic.class))).thenReturn(Optional.of(updatedComic));

        mockMvc.perform(put("/api/comics/123-abc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedComic)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Spiderman: Blue - Deluxe Edition"))
                .andExpect(jsonPath("$.price").value(24.99));

        verify(comicService, times(1)).updateComic(eq("123-abc"), any(Comic.class));
    }

    @Test
    @DisplayName("PUT /api/comics/{id} - Debe retornar NOT FOUND al actualizar si el cómic no existe")
    void debeRetornarNotFoundAlActualizar() throws Exception {
        when(comicService.updateComic(eq("non-existent"), any(Comic.class))).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/comics/non-existent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(comicTest)))
                .andExpect(status().isNotFound());

        verify(comicService, times(1)).updateComic(eq("non-existent"), any(Comic.class));
    }

    @Test
    @DisplayName("DELETE /api/comics/{id} - Debe eliminar un cómic exitosamente")
    void debeEliminarComicExitosamente() throws Exception {
        when(comicService.deleteComic("123-abc")).thenReturn(true);

        mockMvc.perform(delete("/api/comics/123-abc"))
                .andExpect(status().isNoContent());

        verify(comicService, times(1)).deleteComic("123-abc");
    }

    @Test
    @DisplayName("DELETE /api/comics/{id} - Debe retornar NOT FOUND al eliminar si el cómic no existe")
    void debeRetornarNotFoundAlEliminar() throws Exception {
        when(comicService.deleteComic("non-existent")).thenReturn(false);

        mockMvc.perform(delete("/api/comics/non-existent"))
                .andExpect(status().isNotFound());

        verify(comicService, times(1)).deleteComic("non-existent");
    }

    @Test
    @DisplayName("GET /api/comics/health - Debe retornar UP")
    void debeRetornarHealthCheck() throws Exception {
        mockMvc.perform(get("/api/comics/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("microservicio-comics"))
                .andExpect(jsonPath("$.port").value("8081"));
    }
}
