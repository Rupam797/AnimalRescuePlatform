package com.pawrescue.controller;

import com.pawrescue.dto.*;
import com.pawrescue.entity.User;
import com.pawrescue.model.ReportStatus;
import com.pawrescue.model.Severity;
import com.pawrescue.repository.UserRepository;
import com.pawrescue.security.UserDetailsImpl;
import com.pawrescue.service.AdminService;
import com.pawrescue.service.RescueReportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class RescueReportController {

    private final RescueReportService reportService;
    private final AdminService adminService;
    private final UserRepository userRepository;

    public RescueReportController(RescueReportService reportService,
                                  AdminService adminService,
                                  UserRepository userRepository) {
        this.reportService = reportService;
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl principal)) {
            return null;
        }
        return userRepository.findById(principal.getId()).orElse(null);
    }

    // Multipart form submission
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> createReportMultipart(
            @RequestParam("animalType") String animalType,
            @RequestParam(value = "animalName", required = false) String animalName,
            @RequestParam("description") String description,
            @RequestParam(value = "severity", required = false) Severity severity,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "landmark", required = false) String landmark,
            @RequestParam(value = "contactPhone", required = false) String contactPhone,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        CreateReportRequest request = new CreateReportRequest();
        request.setAnimalType(animalType);
        request.setAnimalName(animalName);
        request.setDescription(description);
        request.setSeverity(severity != null ? severity : Severity.MEDIUM);
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setAddress(address);
        request.setLandmark(landmark);
        request.setContactPhone(contactPhone);

        MultipartFile imageToUpload = image != null ? image : file;
        User user = getAuthenticatedUser(authentication);
        ReportResponse response = reportService.createReport(request, imageToUpload, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // JSON submission
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ReportResponse> createReportJson(
            @Valid @RequestBody CreateReportRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        ReportResponse response = reportService.createReport(request, null, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Get current user's submitted reports
    @GetMapping("/my")
    public ResponseEntity<List<ReportResponse>> getMyReports(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.getMyReports(user));
    }

    // Get all reports (with filtering & pagination) - Admin view
    @GetMapping
    public ResponseEntity<?> getAllReports(
            @RequestParam(value = "status", required = false) ReportStatus status,
            @RequestParam(value = "severity", required = false) Severity severity,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size,
            @RequestParam(value = "paged", defaultValue = "false") boolean paged) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReportResponse> reportPage = reportService.getAllReports(status, severity, search, pageRequest);

        if (!paged) {
            // Return flat list for backward compatibility with existing dashboard code
            return ResponseEntity.ok(reportPage.getContent());
        }
        return ResponseEntity.ok(reportPage);
    }

    // Get a single report
    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.getReportById(id, user));
    }

    // Update status (Admin or assigned Volunteer)
    @PutMapping("/{id}/status")
    public ResponseEntity<ReportResponse> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.updateStatus(id, request, user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ReportResponse> patchReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        String statusStr = body.get("status");
        ReportStatus status = ReportStatus.valueOf(statusStr.toUpperCase().replace(" ", "_"));
        UpdateStatusRequest req = new UpdateStatusRequest(status, body.get("note"));
        return ResponseEntity.ok(reportService.updateStatus(id, req, user));
    }

    // Upload an image for a report
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReportResponse> uploadReportImage(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        MultipartFile uploadFile = file != null ? file : image;
        return ResponseEntity.ok(reportService.addReportPhoto(id, uploadFile, user));
    }

    // Assign or reassign volunteer (Admin only)
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportResponse> assignVolunteer(
            @PathVariable Long id,
            @Valid @RequestBody AssignVolunteerRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.assignVolunteer(id, request, user));
    }

    // Unassign volunteer (Admin only)
    @DeleteMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportResponse> unassignVolunteer(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(reportService.unassignVolunteer(id, user));
    }

    // Backward-compatible endpoint for existing dashboard statistics
    @GetMapping("/statistics")
    public ResponseEntity<DashboardStatsResponse> getStatistics() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
