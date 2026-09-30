package com.arcadia.comics.service;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.repository.ComicRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests para ComicService")
class ComicServiceTest {

    @Mock
    private ComicRepository comicRepository;

    @InjectMocks
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
    @DisplayName("Debe obtener todos los cómics")
    void debeObtenerTodosLosComics() {
        Comic comic2 = new Comic(
                "456-def",
                "Batman: Year One",
                "Frank Miller",
                "DC Comics",
                14.99,
                5,
                "http://image.url/batman_y1.jpg",
                "The origin story of Batman.",
                "1987-02-01",
                "Superhero",
                120,
                "English"
        );
        when(comicRepository.findAll()).thenReturn(Arrays.asList(comicTest, comic2));

        List<Comic> resultado = comicService.getAllComics();

        assertNotNull(resultado);
        assertEquals(2, resultado.size());
        assertEquals("Spiderman: Blue", resultado.get(0).getTitle());
        assertEquals("Batman: Year One", resultado.get(1).getTitle());
        verify(comicRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Debe obtener un cómic por ID cuando existe")
    void debeObtenerComicPorIdCuandoExiste() {
        when(comicRepository.findById("123-abc")).thenReturn(Optional.of(comicTest));

        Optional<Comic> resultado = comicService.getComicById("123-abc");

        assertTrue(resultado.isPresent());
        assertEquals("Spiderman: Blue", resultado.get().getTitle());
        verify(comicRepository, times(1)).findById("123-abc");
    }

    @Test
    @DisplayName("Debe retornar vacío al obtener un cómic por ID que no existe")
    void debeRetornarVacioAlObtenerComicPorIdQueNoExiste() {
        when(comicRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Optional<Comic> resultado = comicService.getComicById("invalid-id");

        assertFalse(resultado.isPresent());
        verify(comicRepository, times(1)).findById("invalid-id");
    }

    @Test
    @DisplayName("Debe crear un cómic generando un ID si no tiene uno asignado")
    void debeCrearComicGenerandoIdSiNoTiene() {
        Comic comicSinId = new Comic(
                null,
                "Iron Man: Extremis",
                "Warren Ellis",
                "Marvel Comics",
                17.99,
                15,
                "http://image.url/extremis.jpg",
                "Iron Man gets upgraded.",
                "2005-04-01",
                "Superhero",
                160,
                "English"
        );

        when(comicRepository.save(any(Comic.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Comic resultado = comicService.createComic(comicSinId);

        assertNotNull(resultado);
        assertNotNull(resultado.getId());
        assertFalse(resultado.getId().isEmpty());
        assertEquals("Iron Man: Extremis", resultado.getTitle());
        verify(comicRepository, times(1)).save(any(Comic.class));
    }

    @Test
    @DisplayName("Debe crear un cómic manteniendo su ID si ya tiene uno asignado")
    void debeCrearComicManteniendoIdSiYaTiene() {
        when(comicRepository.save(any(Comic.class))).thenReturn(comicTest);

        Comic resultado = comicService.createComic(comicTest);

        assertNotNull(resultado);
        assertEquals("123-abc", resultado.getId());
        assertEquals("Spiderman: Blue", resultado.getTitle());
        verify(comicRepository, times(1)).save(any(Comic.class));
    }

    @Test
    @DisplayName("Debe actualizar un cómic existente")
    void debeActualizarComicExistente() {
        Comic datosActualizar = new Comic(
                "123-abc",
                "Spiderman: Blue - Deluxe Edition",
                "Jeph Loeb & Tim Sale",
                "Marvel",
                24.99,
                8,
                "http://image.url/spiderman_blue_deluxe.jpg",
                "Updated description.",
                "2002-07-01",
                "Superhero / Romance",
                160,
                "English"
        );

        when(comicRepository.findById("123-abc")).thenReturn(Optional.of(comicTest));
        when(comicRepository.save(any(Comic.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<Comic> resultado = comicService.updateComic("123-abc", datosActualizar);

        assertTrue(resultado.isPresent());
        assertEquals("Spiderman: Blue - Deluxe Edition", resultado.get().getTitle());
        assertEquals("Jeph Loeb & Tim Sale", resultado.get().getAuthor());
        assertEquals("Marvel", resultado.get().getPublisher());
        assertEquals(24.99, resultado.get().getPrice());
        assertEquals(8, resultado.get().getStock());
        assertEquals("http://image.url/spiderman_blue_deluxe.jpg", resultado.get().getCoverImage());
        assertEquals("Updated description.", resultado.get().getDescription());
        assertEquals("Superhero / Romance", resultado.get().getGenre());
        assertEquals(160, resultado.get().getPages());
        verify(comicRepository, times(1)).findById("123-abc");
        verify(comicRepository, times(1)).save(any(Comic.class));
    }

    @Test
    @DisplayName("Debe retornar vacío al actualizar un cómic que no existe")
    void debeRetornarVacioAlActualizarComicQueNoExiste() {
        Comic datosActualizar = new Comic(
                "non-existent",
                "Spiderman: Blue - Deluxe Edition",
                "Jeph Loeb & Tim Sale",
                "Marvel",
                24.99,
                8,
                "http://image.url/spiderman_blue_deluxe.jpg",
                "Updated description.",
                "2002-07-01",
                "Superhero",
                160,
                "English"
        );

        when(comicRepository.findById("non-existent")).thenReturn(Optional.empty());

        Optional<Comic> resultado = comicService.updateComic("non-existent", datosActualizar);

        assertFalse(resultado.isPresent());
        verify(comicRepository, times(1)).findById("non-existent");
        verify(comicRepository, never()).save(any(Comic.class));
    }

    @Test
    @DisplayName("Debe eliminar un cómic si existe")
    void debeEliminarComicSiExiste() {
        when(comicRepository.existsById("123-abc")).thenReturn(true);
        doNothing().when(comicRepository).deleteById("123-abc");

        boolean resultado = comicService.deleteComic("123-abc");

        assertTrue(resultado);
        verify(comicRepository, times(1)).existsById("123-abc");
        verify(comicRepository, times(1)).deleteById("123-abc");
    }

    @Test
    @DisplayName("Debe retornar false al intentar eliminar un cómic que no existe")
    void debeRetornarFalseAlEliminarComicQueNoExiste() {
        when(comicRepository.existsById("non-existent")).thenReturn(false);

        boolean resultado = comicService.deleteComic("non-existent");

        assertFalse(resultado);
        verify(comicRepository, times(1)).existsById("non-existent");
        verify(comicRepository, never()).deleteById(anyString());
    }
}
