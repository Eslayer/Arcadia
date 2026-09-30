package com.arcadia.comics.repository;

import com.arcadia.comics.model.Favorito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoritoRepository extends JpaRepository<Favorito, Long> {
    List<Favorito> findByUsuarioEmail(String usuarioEmail);
    Optional<Favorito> findByUsuarioEmailAndComicId(String usuarioEmail, String comicId);
    
    @Transactional
    void deleteByUsuarioEmailAndComicId(String usuarioEmail, String comicId);
}
