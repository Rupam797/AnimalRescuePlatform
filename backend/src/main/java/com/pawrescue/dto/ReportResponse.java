package com.pawrescue.dto;

import com.pawrescue.entity.RescueReport;
import com.pawrescue.model.ReportStatus;
import com.pawrescue.model.Severity;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class ReportResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reporterPhone;
    private String animalName;
    private String animalType;
    private String description;
    private Severity severity;
    private Double latitude;
    private Double longitude;
    private String address;
    private String landmark;
    private String contactPhone;
    private ReportStatus status;
    private List<String> images;
    private List<AssignmentResponse> assignments;
    private List<StatusHistoryResponse> statusHistories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ReportResponse() {
    }

    public static ReportResponse fromEntity(RescueReport report) {
        if (report == null) return null;
        ReportResponse dto = new ReportResponse();
        dto.setId(report.getId());
        if (report.getReporter() != null) {
            dto.setReporterId(report.getReporter().getId());
            dto.setReporterName(report.getReporter().getName());
            dto.setReporterEmail(report.getReporter().getEmail());
            dto.setReporterPhone(report.getReporter().getPhone());
        }
        dto.setAnimalName(report.getAnimalName());
        dto.setAnimalType(report.getAnimalType());
        dto.setDescription(report.getDescription());
        dto.setSeverity(report.getSeverity());
        dto.setLatitude(report.getLatitude());
        dto.setLongitude(report.getLongitude());
        dto.setAddress(report.getAddress());
        dto.setLandmark(report.getLandmark());
        dto.setContactPhone(report.getContactPhone());
        dto.setStatus(report.getStatus());

        if (report.getImages() != null) {
            dto.setImages(report.getImages().stream().map(img -> img.getImageUrl()).collect(Collectors.toList()));
        } else {
            dto.setImages(Collections.emptyList());
        }

        if (report.getAssignments() != null) {
            dto.setAssignments(report.getAssignments().stream().map(AssignmentResponse::fromEntity).collect(Collectors.toList()));
        } else {
            dto.setAssignments(Collections.emptyList());
        }

        if (report.getStatusHistories() != null) {
            dto.setStatusHistories(report.getStatusHistories().stream().map(StatusHistoryResponse::fromEntity).collect(Collectors.toList()));
        } else {
            dto.setStatusHistories(Collections.emptyList());
        }

        dto.setCreatedAt(report.getCreatedAt());
        dto.setUpdatedAt(report.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getReporterEmail() {
        return reporterEmail;
    }

    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }

    public String getReporterPhone() {
        return reporterPhone;
    }

    public void setReporterPhone(String reporterPhone) {
        this.reporterPhone = reporterPhone;
    }

    public String getAnimalName() {
        return animalName;
    }

    public void setAnimalName(String animalName) {
        this.animalName = animalName;
    }

    public String getAnimalType() {
        return animalType;
    }

    public void setAnimalType(String animalType) {
        this.animalType = animalType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<AssignmentResponse> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<AssignmentResponse> assignments) {
        this.assignments = assignments;
    }

    public List<StatusHistoryResponse> getStatusHistories() {
        return statusHistories;
    }

    public void setStatusHistories(List<StatusHistoryResponse> statusHistories) {
        this.statusHistories = statusHistories;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
