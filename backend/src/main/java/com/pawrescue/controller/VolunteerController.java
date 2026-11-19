package com.pawrescue.controller;

import com.pawrescue.dto.ReportResponse;
import com.pawrescue.dto.UpdateStatusRequest;
import com.pawrescue.entity.User;
import com.pawrescue.repository.UserRepository;
import com.pawrescue.security.UserDetailsImpl;
import com.pawrescue.service.RescueReportService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/volunteer")
@PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
public class VolunteerController {

    private final RescueReportService reportService;
    private final UserRepository userRepository;

    public VolunteerController(RescueReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl principal)) {
            return null;
        }
        return userRepository.findById(principal.getId()).orElse(null);
    }

    @GetMapping("/cases")
    public ResponseEntity<List<ReportResponse>> getVolunteerCases(Authentication authentication) {
        User volunteer = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.getVolunteerCases(volunteer));
    }

    @GetMapping("/available-reports")
    public ResponseEntity<List<ReportResponse>> getAvailableReports() {
        return ResponseEntity.ok(reportService.getAvailableReports());
    }

    @PostMapping("/cases/{id}/claim")
    public ResponseEntity<ReportResponse> claimCase(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.claimReport(id, user));
    }

    @PutMapping("/cases/{id}/status")
    public ResponseEntity<ReportResponse> updateCaseStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.updateStatus(id, request, user));
    }

    @PostMapping(value = "/cases/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> addCasePhoto(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        MultipartFile uploadFile = file != null ? file : image;
        return ResponseEntity.ok(reportService.addReportPhoto(id, uploadFile, user));
    }
}
