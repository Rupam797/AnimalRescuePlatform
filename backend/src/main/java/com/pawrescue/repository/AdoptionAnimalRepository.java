package com.pawrescue.repository;

import com.pawrescue.entity.AdoptionAnimal;
import com.pawrescue.model.AdoptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdoptionAnimalRepository extends JpaRepository<AdoptionAnimal, Long> {

    List<AdoptionAnimal> findByStatusOrderByPublishedAtDesc(AdoptionStatus status);

    long countByStatus(AdoptionStatus status);

    @Query("SELECT a FROM AdoptionAnimal a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:species IS NULL OR LOWER(a.species) = LOWER(:species)) AND " +
           "(:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.breed) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<AdoptionAnimal> findFiltered(
            @Param("status") AdoptionStatus status,
            @Param("species") String species,
            @Param("search") String search,
            Pageable pageable
    );
}
