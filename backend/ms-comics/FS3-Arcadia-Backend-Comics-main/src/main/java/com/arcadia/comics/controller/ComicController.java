package com.arcadia.comics.controller;

import com.arcadia.comics.model.Comic;
import com.arcadia.comics.model.Favorito;
import com.arcadia.comics.repository.FavoritoRepository;
import com.arcadia.comics.service.ComicService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/comics")
public class ComicController {

    private final ComicService comicService;
    private final FavoritoRepository favoritoRepository;

    public ComicController(ComicService comicService, FavoritoRepository favoritoRepository) {
        this.comicService = comicService;
        this.favoritoRepository = favoritoRepository;
    }

    @GetMapping
    public ResponseEntity<List<Comic>> getAllComics() {
        return ResponseEntity.ok(comicService.getAllComics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comic> getComicById(@PathVariable String id) {
        Optional<Comic> comic = comicService.getComicById(id);
        return comic.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Comic> createComic(@RequestBody Comic comic) {
        Comic createdComic = comicService.createComic(comic);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdComic);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Comic> updateComic(@PathVariable String id, @RequestBody Comic comic) {
        Optional<Comic> updatedComic = comicService.updateComic(id, comic);
        return updatedComic.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComic(@PathVariable String id) {
        boolean deleted = comicService.deleteComic(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // ── Favoritos Persistentes en la Nube (AWS RDS) ─────────────

    @GetMapping("/favoritos")
    public ResponseEntity<List<Comic>> getFavoritosByUser(@RequestParam String email) {
        List<String> comicIds = favoritoRepository.findByUsuarioEmail(email)
                .stream()
                .map(Favorito::getComicId)
                .toList();

        List<Comic> favComics = comicIds.stream()
                .map(comicService::getComicById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        return ResponseEntity.ok(favComics);
    }

    @PostMapping("/favoritos")
    public ResponseEntity<?> addFavorito(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String comicId = body.get("comicId");
        if (email == null || comicId == null || email.isBlank() || comicId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email y comicId son obligatorios"));
        }

        if (favoritoRepository.findByUsuarioEmailAndComicId(email, comicId).isEmpty()) {
            Favorito fav = new Favorito(email, comicId);
            favoritoRepository.save(fav);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SAVED_TO_CLOUD"));
    }

    @DeleteMapping("/favoritos")
    public ResponseEntity<?> removeFavorito(@RequestParam String email, @RequestParam String comicId) {
        favoritoRepository.deleteByUsuarioEmailAndComicId(email, comicId);
        return ResponseEntity.ok(Map.of("status", "REMOVED_FROM_CLOUD"));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "microservicio-comics",
                "port", "8081"
        ));
    }
}
