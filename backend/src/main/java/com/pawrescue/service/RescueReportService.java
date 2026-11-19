package com.pawrescue.service;

import com.pawrescue.dto.*;
import com.pawrescue.entity.*;
import com.pawrescue.exception.BadRequestException;
import com.pawrescue.exception.ResourceNotFoundException;
import com.pawrescue.exception.UnauthorizedException;
import com.pawrescue.model.ReportStatus;
import com.pawrescue.model.Role;
import com.pawrescue.model.Severity;
import com.pawrescue.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RescueReportService {

    private final RescueReportRepository reportRepository;
    private final ReportImageRepository reportImageRepository;
    private final RescueAssignmentRepository assignmentRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final AppNotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    public RescueReportService(RescueReportRepository reportRepository,
                               ReportImageRepository reportImageRepository,
                               RescueAssignmentRepository assignmentRepository,
                               StatusHistoryRepository statusHistoryRepository,
                               UserRepository userRepository,
                               AppNotificationRepository notificationRepository,
                               FileStorageService fileStorageService) {
        this.reportRepository = reportRepository;
        this.reportImageRepository = reportImageRepository;
        this.assignmentRepository = assignmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ReportResponse createReport(CreateReportRequest request, MultipartFile image, User reporter) {
        RescueReport report = new RescueReport();
        report.setReporter(reporter);
        report.setAnimalType(request.getAnimalType().trim());
        report.setAnimalName(request.getAnimalName() != null && !request.getAnimalName().isBlank()
                ? request.getAnimalName().trim()
                : "Injured " + request.getAnimalType().trim());
        report.setDescription(request.getDescription().trim());
        report.setSeverity(request.getSeverity() != null ? request.getSeverity() : Severity.MEDIUM);
        report.setLatitude(request.getLatitude());
        report.setLongitude(request.getLongitude());
        report.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        report.setLandmark(request.getLandmark() != null ? request.getLandmark().trim() : null);
        report.setContactPhone(request.getContactPhone() != null && !request.getContactPhone().isBlank()
                ? request.getContactPhone().trim()
                : (reporter != null ? reporter.getPhone() : null));
        report.setStatus(ReportStatus.REPORTED);

        RescueReport savedReport = reportRepository.save(report);

        // Upload and link image if present
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            ReportImage reportImage = new ReportImage(savedReport, imageUrl);
            savedReport.getImages().add(reportImage);
            reportImageRepository.save(reportImage);
        }

        // Add initial status history
        StatusHistory initialHistory = new StatusHistory(
                savedReport,
                null,
                ReportStatus.REPORTED,
                reporter,
                "Case initially reported"
        );
        savedReport.getStatusHistories().add(initialHistory);
        statusHistoryRepository.save(initialHistory);

        // Notify admins
        AppNotification notification = new AppNotification(
                "New Animal Report",
                "A new " + savedReport.getSeverity() + " priority report for " + savedReport.getAnimalType() +
                (savedReport.getAddress() != null ? " at " + savedReport.getAddress() : "") + " needs attention.",
                "RESCUE",
                savedReport.getId()
        );
        notificationRepository.save(notification);

        return ReportResponse.fromEntity(savedReport);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getMyReports(User reporter) {
        return reportRepository.findByReporterOrderByCreatedAtDesc(reporter)
                .stream()
                .map(ReportResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id, User currentUser) {
        RescueReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue report not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isVolunteer = currentUser.getRole() == Role.ROLE_VOLUNTEER;
        boolean isOwner = report.getReporter() != null && report.getReporter().getId().equals(currentUser.getId());
        boolean isAssigned = report.getAssignments().stream()
                .anyMatch(a -> a.getVolunteer().getId().equals(currentUser.getId()));

        if (!isAdmin && !isOwner && !isAssigned && !isVolunteer) {
            throw new UnauthorizedException("You are not authorized to view this report.");
        }

        return ReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getAllReports(ReportStatus status, Severity severity, String search, Pageable pageable) {
        return reportRepository.findWithFilters(status, severity, search, pageable)
                .map(ReportResponse::fromEntity);
    }

    @Transactional
    public ReportResponse updateStatus(Long id, UpdateStatusRequest request, User currentUser) {
        RescueReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue report not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isAssignedVolunteer = report.getAssignments().stream()
                .anyMatch(a -> a.getVolunteer().getId().equals(currentUser.getId()));

        if (!isAdmin && !isAssignedVolunteer) {
            throw new UnauthorizedException("Only the administrator or the assigned volunteer can update report status.");
        }

        ReportStatus currentStatus = report.getStatus();
        ReportStatus targetStatus = request.getStatus();

        if (!currentStatus.canTransitionTo(targetStatus, isAdmin)) {
            throw new BadRequestException("Invalid status transition from " + currentStatus + " to " + targetStatus +
                    (isAdmin ? " (Admin rules)" : " (Volunteer rules)"));
        }

        report.setStatus(targetStatus);

        StatusHistory history = new StatusHistory(
                report,
                currentStatus,
                targetStatus,
                currentUser,
                request.getNote() != null && !request.getNote().isBlank()
                        ? request.getNote().trim()
                        : "Status changed to " + targetStatus
        );
        report.getStatusHistories().add(history);
        statusHistoryRepository.save(history);

        RescueReport updated = reportRepository.save(report);

        // Notify reporter and admins
        String msg = updated.getAnimalName() + " status updated from " + currentStatus + " to " + targetStatus;
        notificationRepository.save(new AppNotification("Status Updated", msg, "STATUS_CHANGE", updated.getId()));

        return ReportResponse.fromEntity(updated);
    }

    @Transactional
    public ReportResponse assignVolunteer(Long reportId, AssignVolunteerRequest request, User admin) {
        RescueReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue report not found with id: " + reportId));

        User volunteer = userRepository.findById(request.getVolunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + request.getVolunteerId()));

        if (volunteer.getRole() != Role.ROLE_VOLUNTEER) {
            throw new BadRequestException("User " + volunteer.getName() + " is not registered as a volunteer.");
        }

        if (!volunteer.isApproved() || !volunteer.isEnabled()) {
            throw new BadRequestException("Volunteer is not active or approved.");
        }

        // Create assignment
        RescueAssignment assignment = new RescueAssignment(
                report,
                volunteer,
                admin,
                request.getNotes() != null ? request.getNotes().trim() : null
        );
        report.getAssignments().add(assignment);
        assignmentRepository.save(assignment);

        // If currently REPORTED, transition to ASSIGNED
        ReportStatus oldStatus = report.getStatus();
        if (oldStatus == ReportStatus.REPORTED) {
            report.setStatus(ReportStatus.ASSIGNED);

            StatusHistory history = new StatusHistory(
                    report,
                    oldStatus,
                    ReportStatus.ASSIGNED,
                    admin,
                    "Assigned to volunteer: " + volunteer.getName()
            );
            report.getStatusHistories().add(history);
            statusHistoryRepository.save(history);
        }

        RescueReport saved = reportRepository.save(report);

        // Send notification
        AppNotification notification = new AppNotification(
                "Volunteer Assigned",
                volunteer.getName() + " was assigned to case #" + saved.getId() + " (" + saved.getAnimalName() + ")",
                "ASSIGNMENT",
                saved.getId()
        );
        notificationRepository.save(notification);

        return ReportResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getVolunteerCases(User volunteer) {
        return reportRepository.findAssignedToVolunteer(volunteer)
                .stream()
                .map(ReportResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getAvailableReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.REPORTED)
                .stream()
                .map(ReportResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReportResponse claimReport(Long reportId, User volunteer) {
        RescueReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue report not found with id: " + reportId));

        if (volunteer.getRole() != Role.ROLE_VOLUNTEER && volunteer.getRole() != Role.ROLE_ADMIN) {
            throw new BadRequestException("Only registered volunteers or administrators can accept rescue cases.");
        }

        if (!volunteer.isApproved() || !volunteer.isEnabled()) {
            throw new BadRequestException("Volunteer account is not active or approved.");
        }

        boolean alreadyAssigned = report.getAssignments().stream()
                .anyMatch(a -> a.getVolunteer().getId().equals(volunteer.getId()));

        if (!alreadyAssigned) {
            RescueAssignment assignment = new RescueAssignment(
                    report,
                    volunteer,
                    volunteer,
                    "Self-assigned by volunteer " + volunteer.getName()
            );
            report.getAssignments().add(assignment);
            assignmentRepository.save(assignment);
        }

        if (report.getStatus() == ReportStatus.REPORTED) {
            report.setStatus(ReportStatus.ASSIGNED);

            StatusHistory history = new StatusHistory(
                    report,
                    ReportStatus.REPORTED,
                    ReportStatus.ASSIGNED,
                    volunteer,
                    "Volunteer " + volunteer.getName() + " accepted and claimed this rescue case."
            );
            report.getStatusHistories().add(history);
            statusHistoryRepository.save(history);
        }

        RescueReport saved = reportRepository.save(report);

        notificationRepository.save(new AppNotification(
                "Rescue Mission Accepted",
                volunteer.getName() + " claimed rescue case #" + saved.getId() + " (" + saved.getAnimalName() + ")",
                "ASSIGNMENT",
                saved.getId()
        ));

        return ReportResponse.fromEntity(saved);
    }

    @Transactional
    public ReportResponse addReportPhoto(Long id, MultipartFile file, User currentUser) {
        RescueReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue report not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isAssigned = report.getAssignments().stream()
                .anyMatch(a -> a.getVolunteer().getId().equals(currentUser.getId()));
        boolean isOwner = report.getReporter() != null && report.getReporter().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssigned && !isOwner) {
            throw new UnauthorizedException("You do not have permission to attach photos to this report.");
        }

        String imageUrl = fileStorageService.storeFile(file);
        ReportImage reportImage = new ReportImage(report, imageUrl);
        report.getImages().add(reportImage);
        reportImageRepository.save(reportImage);

        return ReportResponse.fromEntity(reportRepository.save(report));
    }
}
