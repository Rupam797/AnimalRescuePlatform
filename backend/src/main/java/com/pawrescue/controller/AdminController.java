package com.pawrescue.controller;

import com.pawrescue.dto.DashboardStatsResponse;
import com.pawrescue.dto.ReportResponse;
import com.pawrescue.dto.UserResponse;
import com.pawrescue.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/volunteers")
    public ResponseEntity<List<UserResponse>> getVolunteers() {
        return ResponseEntity.ok(adminService.getVolunteers());
    }

    @PutMapping("/volunteers/{id}/approve")
    public ResponseEntity<UserResponse> approveVolunteer(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveVolunteer(id));
    }

    @PutMapping("/users/{id}/disable")
    public ResponseEntity<UserResponse> disableUser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Boolean> body) {
        boolean disable = (body == null || body.getOrDefault("disabled", true));
        return ResponseEntity.ok(adminService.disableUser(id, disable));
    }

    @GetMapping("/recovered-reports")
    public ResponseEntity<List<ReportResponse>> getRecoveredReportsForAdoption() {
        return ResponseEntity.ok(adminService.getRecoveredReportsForAdoption());
    }
}
