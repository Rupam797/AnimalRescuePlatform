package com.pawrescue.controller;

import com.pawrescue.dto.*;
import com.pawrescue.entity.User;
import com.pawrescue.model.AdoptionRequestStatus;
import com.pawrescue.repository.UserRepository;
import com.pawrescue.security.UserDetailsImpl;
import com.pawrescue.service.AdoptionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adoptions")
public class AdoptionController {

    private final AdoptionService adoptionService;
    private final UserRepository userRepository;

    public AdoptionController(AdoptionService adoptionService, UserRepository userRepository) {
        this.adoptionService = adoptionService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl principal)) {
            return null;
        }
        return userRepository.findById(principal.getId()).orElse(null);
    }

    // Public adoption gallery
    @GetMapping
    public ResponseEntity<?> getAdoptableAnimals(
            @RequestParam(value = "species", required = false) String species,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "30") int size,
            @RequestParam(value = "all", defaultValue = "false") boolean all) {

        if (all) {
            return ResponseEntity.ok(adoptionService.getAllAnimalsForAdmin());
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        Page<AdoptionAnimalResponse> animals = adoptionService.getAdoptableAnimals(species, search, pageRequest);
        return ResponseEntity.ok(animals);
    }

    // Public single animal detail
    @GetMapping("/{id}")
    public ResponseEntity<AdoptionAnimalResponse> getAnimalById(@PathVariable Long id) {
        return ResponseEntity.ok(adoptionService.getAdoptableAnimalById(id));
    }

    // Admin filter adoption list and stats by month / date range
    @GetMapping("/adopted-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdoptionReportResponse> getAdoptedReport(
            @RequestParam(value = "fromMonth", required = false) String fromMonth,
            @RequestParam(value = "toMonth", required = false) String toMonth,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "species", required = false) String species) {
        return ResponseEntity.ok(adoptionService.getAdoptedReport(fromMonth, toMonth, startDate, endDate, species));
    }

    // Admin publish animal
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdoptionAnimalResponse> publishAnimal(
            @Valid @RequestBody PublishAdoptionRequest request,
            Authentication authentication) {
        User admin = getAuthenticatedUser(authentication);
        AdoptionAnimalResponse response = adoptionService.publishAnimal(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Admin edit adoption
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdoptionAnimalResponse> updateAdoption(
            @PathVariable Long id,
            @Valid @RequestBody PublishAdoptionRequest request) {
        return ResponseEntity.ok(adoptionService.updateAdoption(id, request));
    }

    // Admin delete adoption
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAdoption(@PathVariable Long id) {
        adoptionService.deleteAdoption(id);
        return ResponseEntity.noContent().build();
    }

    // User send adoption request
    @PostMapping("/{id}/request")
    public ResponseEntity<AdoptionRequestResponse> submitAdoptionRequest(
            @PathVariable Long id,
            @Valid @RequestBody CreateAdoptionRequestDto requestDto,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        AdoptionRequestResponse response = adoptionService.requestAdoption(id, requestDto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // User view my requests
    @GetMapping("/my-requests")
    public ResponseEntity<List<AdoptionRequestResponse>> getMyRequests(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(adoptionService.getMyAdoptionRequests(user));
    }

    // Admin view all adoption requests
    @GetMapping("/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdoptionRequestResponse>> getAllRequests(
            @RequestParam(value = "status", required = false) AdoptionRequestStatus status) {
        return ResponseEntity.ok(adoptionService.getAllAdoptionRequests(status));
    }

    // Admin approve/reject adoption request
    @PutMapping("/requests/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdoptionRequestResponse> updateRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdoptionRequestStatus statusDto,
            Authentication authentication) {
        User admin = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(adoptionService.updateRequestStatus(id, statusDto.getStatus(), admin));
    }
}
