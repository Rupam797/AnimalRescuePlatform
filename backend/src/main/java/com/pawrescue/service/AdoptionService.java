package com.pawrescue.service;

import com.pawrescue.dto.*;
import com.pawrescue.entity.*;
import com.pawrescue.exception.BadRequestException;
import com.pawrescue.exception.ResourceNotFoundException;
import com.pawrescue.model.*;
import com.pawrescue.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdoptionService {

    private final AdoptionAnimalRepository adoptionAnimalRepository;
    private final AdoptionRequestRepository adoptionRequestRepository;
    private final RescueReportRepository rescueReportRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final AppNotificationRepository notificationRepository;

    public AdoptionService(AdoptionAnimalRepository adoptionAnimalRepository,
                           AdoptionRequestRepository adoptionRequestRepository,
                           RescueReportRepository rescueReportRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           AppNotificationRepository notificationRepository) {
        this.adoptionAnimalRepository = adoptionAnimalRepository;
        this.adoptionRequestRepository = adoptionRequestRepository;
        this.rescueReportRepository = rescueReportRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdoptionAnimalResponse> getAdoptableAnimals(String species, String search, Pageable pageable) {
        return adoptionAnimalRepository.findFiltered(AdoptionStatus.AVAILABLE, species, search, pageable)
                .map(AdoptionAnimalResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AdoptionAnimalResponse> getAllAnimalsForAdmin() {
        return adoptionAnimalRepository.findAll()
                .stream()
                .map(AdoptionAnimalResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdoptionAnimalResponse getAdoptableAnimalById(Long id) {
        AdoptionAnimal animal = adoptionAnimalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption animal not found with id: " + id));
        return AdoptionAnimalResponse.fromEntity(animal);
    }

    @Transactional
    public AdoptionAnimalResponse publishAnimal(PublishAdoptionRequest request, User admin) {
        AdoptionAnimal animal = new AdoptionAnimal();
        animal.setName(request.getName().trim());
        animal.setSpecies(request.getSpecies().trim());
        animal.setBreed(request.getBreed() != null ? request.getBreed().trim() : null);
        animal.setAge(request.getAge() != null ? request.getAge().trim() : null);
        animal.setGender(request.getGender() != null ? request.getGender().trim() : null);
        animal.setHealthNotes(request.getHealthNotes() != null ? request.getHealthNotes().trim() : null);
        animal.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        animal.setPhotoUrl(request.getPhotoUrl());
        animal.setStatus(AdoptionStatus.AVAILABLE);

        if (request.getReportId() != null) {
            RescueReport report = rescueReportRepository.findById(request.getReportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + request.getReportId()));

            if (report.getStatus() != ReportStatus.RECOVERED) {
                throw new BadRequestException("Only animals in RECOVERED status can be listed for adoption. Current status: " + report.getStatus());
            }

            // Update report status to LISTED_FOR_ADOPTION
            ReportStatus oldStatus = report.getStatus();
            report.setStatus(ReportStatus.LISTED_FOR_ADOPTION);

            StatusHistory history = new StatusHistory(
                    report,
                    oldStatus,
                    ReportStatus.LISTED_FOR_ADOPTION,
                    admin,
                    "Published to Adoption gallery as " + animal.getName()
            );
            report.getStatusHistories().add(history);
            statusHistoryRepository.save(history);
            rescueReportRepository.save(report);

            animal.setReport(report);

            // Inherit photo if animal doesn't have one specified
            if (animal.getPhotoUrl() == null && report.getImages() != null && !report.getImages().isEmpty()) {
                animal.setPhotoUrl(report.getImages().get(0).getImageUrl());
            }
        }

        AdoptionAnimal saved = adoptionAnimalRepository.save(animal);

        // Notify
        AppNotification notification = new AppNotification(
                "New Animal Listed for Adoption",
                saved.getName() + " (" + saved.getSpecies() + ") is now listed and available for adoption!",
                "ADOPTION",
                saved.getId()
        );
        notificationRepository.save(notification);

        return AdoptionAnimalResponse.fromEntity(saved);
    }

    @Transactional
    public AdoptionAnimalResponse updateAdoption(Long id, PublishAdoptionRequest request) {
        AdoptionAnimal animal = adoptionAnimalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption animal not found with id: " + id));

        animal.setName(request.getName().trim());
        animal.setSpecies(request.getSpecies().trim());
        animal.setBreed(request.getBreed() != null ? request.getBreed().trim() : null);
        animal.setAge(request.getAge() != null ? request.getAge().trim() : null);
        animal.setGender(request.getGender() != null ? request.getGender().trim() : null);
        animal.setHealthNotes(request.getHealthNotes() != null ? request.getHealthNotes().trim() : null);
        animal.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()) {
            animal.setPhotoUrl(request.getPhotoUrl());
        }

        return AdoptionAnimalResponse.fromEntity(adoptionAnimalRepository.save(animal));
    }

    @Transactional
    public void deleteAdoption(Long id) {
        AdoptionAnimal animal = adoptionAnimalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption animal not found with id: " + id));
        adoptionAnimalRepository.delete(animal);
    }

    @Transactional
    public AdoptionRequestResponse requestAdoption(Long animalId, CreateAdoptionRequestDto requestDto, User user) {
        AdoptionAnimal animal = adoptionAnimalRepository.findById(animalId)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption animal not found with id: " + animalId));

        if (animal.getStatus() != AdoptionStatus.AVAILABLE) {
            throw new BadRequestException("This animal is currently " + animal.getStatus() + " and not available for new requests.");
        }

        AdoptionRequest request = new AdoptionRequest(
                animal,
                user,
                requestDto.getMessage().trim(),
                requestDto.getPhone().trim()
        );

        AdoptionRequest saved = adoptionRequestRepository.save(request);

        // Notify admins
        AppNotification notification = new AppNotification(
                "New Adoption Application",
                user.getName() + " applied to adopt " + animal.getName() + " (" + animal.getSpecies() + ").",
                "ADOPTION_REQUEST",
                animal.getId()
        );
        notificationRepository.save(notification);

        return AdoptionRequestResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AdoptionRequestResponse> getMyAdoptionRequests(User user) {
        return adoptionRequestRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(AdoptionRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdoptionRequestResponse> getAllAdoptionRequests(AdoptionRequestStatus status) {
        if (status != null) {
            return adoptionRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                    .stream()
                    .map(AdoptionRequestResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        return adoptionRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AdoptionRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdoptionRequestResponse updateRequestStatus(Long requestId, AdoptionRequestStatus newStatus, User admin) {
        AdoptionRequest request = adoptionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption request not found with id: " + requestId));

        request.setStatus(newStatus);
        AdoptionRequest updatedRequest = adoptionRequestRepository.save(request);

        AdoptionAnimal animal = request.getAnimal();

        if (newStatus == AdoptionRequestStatus.APPROVED) {
            // Mark animal ADOPTED
            animal.setStatus(AdoptionStatus.ADOPTED);
            adoptionAnimalRepository.save(animal);

            // If animal was linked to a rescue report, update report status to ADOPTED
            if (animal.getReport() != null) {
                RescueReport report = animal.getReport();
                ReportStatus oldReportStatus = report.getStatus();
                report.setStatus(ReportStatus.ADOPTED);

                StatusHistory history = new StatusHistory(
                        report,
                        oldReportStatus,
                        ReportStatus.ADOPTED,
                        admin,
                        "Adopted by " + request.getUser().getName() + " (Adoption request approved)"
                );
                report.getStatusHistories().add(history);
                statusHistoryRepository.save(history);
                rescueReportRepository.save(report);
            }

            // Auto-reject any OTHER pending requests for this animal
            List<AdoptionRequest> pendingRequests = adoptionRequestRepository
                    .findByAnimalAndStatus(animal, AdoptionRequestStatus.PENDING);

            for (AdoptionRequest other : pendingRequests) {
                if (!other.getId().equals(request.getId())) {
                    other.setStatus(AdoptionRequestStatus.REJECTED);
                    adoptionRequestRepository.save(other);
                }
            }

            // Notify
            AppNotification notification = new AppNotification(
                    "Adoption Approved!",
                    "Adoption of " + animal.getName() + " by " + request.getUser().getName() + " was approved! Congratulations!",
                    "ADOPTION_APPROVED",
                    animal.getId()
            );
            notificationRepository.save(notification);
        }

        return AdoptionRequestResponse.fromEntity(updatedRequest);
    }
}
