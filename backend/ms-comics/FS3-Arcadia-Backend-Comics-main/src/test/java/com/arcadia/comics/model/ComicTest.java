package com.arcadia.comics.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests para Comic Model")
class ComicTest {

    @Test
    @DisplayName("Debe construir un Comic y validar getters y setters")
    void debeValidarConstructorYGettersSetters() {
        Comic comic = new Comic();
        comic.setId("1");
        comic.setTitle("Spiderman");
        comic.setAuthor("Stan Lee");
        comic.setPublisher("Marvel");
        comic.setPrice(10.99);
        comic.setStock(5);
        comic.setCoverImage("img.jpg");
        comic.setDescription("Description");
        comic.setReleaseDate("2024-01-01");
        comic.setGenre("Action");
        comic.setPages(120);
        comic.setLanguage("Spanish");

        assertEquals("1", comic.getId());
        assertEquals("Spiderman", comic.getTitle());
        assertEquals("Stan Lee", comic.getAuthor());
        assertEquals("Marvel", comic.getPublisher());
        assertEquals(10.99, comic.getPrice());
        assertEquals(5, comic.getStock());
        assertEquals("img.jpg", comic.getCoverImage());
        assertEquals("Description", comic.getDescription());
        assertEquals("2024-01-01", comic.getReleaseDate());
        assertEquals("Action", comic.getGenre());
        assertEquals(120, comic.getPages());
        assertEquals("Spanish", comic.getLanguage());
    }

    @Test
    @DisplayName("Debe validar equals, hashCode y toString de Lombok")
    void debeValidarEqualsHashCodeToString() {
        Comic comic1 = new Comic("1", "Spiderman", "Stan Lee", "Marvel", 10.99, 5, "img.jpg", "Description", "2024-01-01", "Action", 120, "Spanish");
        Comic comic2 = new Comic("1", "Spiderman", "Stan Lee", "Marvel", 10.99, 5, "img.jpg", "Description", "2024-01-01", "Action", 120, "Spanish");
        Comic comic3 = new Comic("2", "Batman", "Bob Kane", "DC", 12.99, 3, "img2.jpg", "Description 2", "2024-01-02", "Action", 100, "English");

        assertEquals(comic1, comic2);
        assertNotEquals(comic1, comic3);
        assertEquals(comic1.hashCode(), comic2.hashCode());
        assertNotNull(comic1.toString());
    }

    @Test
    @DisplayName("Debe ejecutar onLoad y aplicar valores por defecto para campos nulos")
    void debeEjecutarOnLoadConCamposNulos() throws Exception {
        Comic comic = new Comic(
                "1", "Title", "Author", "Publisher", 10.0, 5, "img",
                null, null, null, null, null
        );

        // Invocar el método privado onLoad por reflexión ya que JPA lo invoca automáticamente al cargar la entidad.
        Method onLoadMethod = Comic.class.getDeclaredMethod("onLoad");
        onLoadMethod.setAccessible(true);
        onLoadMethod.invoke(comic);

        assertEquals("No description available.", comic.getDescription());
        assertEquals("2024-01-01", comic.getReleaseDate());
        assertEquals("Superhero", comic.getGenre());
        assertEquals(100, comic.getPages());
        assertEquals("English", comic.getLanguage());
    }

    @Test
    @DisplayName("Debe ejecutar onLoad y mantener valores preexistentes si no son nulos")
    void debeEjecutarOnLoadManteniendoValoresExistentes() throws Exception {
        Comic comic = new Comic(
                "1", "Title", "Author", "Publisher", 10.0, 5, "img",
                "Custom Description", "2020-05-05", "Sci-Fi", 300, "French"
        );

        Method onLoadMethod = Comic.class.getDeclaredMethod("onLoad");
        onLoadMethod.setAccessible(true);
        onLoadMethod.invoke(comic);

        assertEquals("Custom Description", comic.getDescription());
        assertEquals("2020-05-05", comic.getReleaseDate());
        assertEquals("Sci-Fi", comic.getGenre());
        assertEquals(300, comic.getPages());
        assertEquals("French", comic.getLanguage());
    }
}
