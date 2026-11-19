package com.pawrescue.repository;

import com.pawrescue.entity.AdoptionAnimal;
import com.pawrescue.entity.AdoptionRequest;
import com.pawrescue.entity.User;
import com.pawrescue.model.AdoptionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdoptionRequestRepository extends JpaRepository<AdoptionRequest, Long> {
    List<AdoptionRequest> findByUserOrderByCreatedAtDesc(User user);
    List<AdoptionRequest> findByAnimalOrderByCreatedAtDesc(AdoptionAnimal animal);
    List<AdoptionRequest> findByStatusOrderByCreatedAtDesc(AdoptionRequestStatus status);
    List<AdoptionRequest> findByAnimalAndStatus(AdoptionAnimal animal, AdoptionRequestStatus status);
    List<AdoptionRequest> findAllByOrderByCreatedAtDesc();
}
