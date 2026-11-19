package com.pawrescue.service;

import com.pawrescue.dto.DashboardStatsResponse;
import com.pawrescue.dto.ReportResponse;
import com.pawrescue.dto.UserResponse;
import com.pawrescue.entity.RescueReport;
import com.pawrescue.entity.User;
import com.pawrescue.exception.BadRequestException;
import com.pawrescue.exception.ResourceNotFoundException;
import com.pawrescue.model.AdoptionStatus;
import com.pawrescue.model.ReportStatus;
import com.pawrescue.model.Role;
import com.pawrescue.repository.AdoptionAnimalRepository;
import com.pawrescue.repository.RescueReportRepository;
import com.pawrescue.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final RescueReportRepository reportRepository;
    private final AdoptionAnimalRepository adoptionAnimalRepository;
    private final UserRepository userRepository;

    public AdminService(RescueReportRepository reportRepository,
                        AdoptionAnimalRepository adoptionAnimalRepository,
                        UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.adoptionAnimalRepository = adoptionAnimalRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        List<RescueReport> allReports = reportRepository.findAll();

        long totalReports = allReports.size();
        long activeCases = 0;
        long rescuedCount = 0;
        long inTreatmentCount = 0;

        Map<String, Long> reportsByType = new LinkedHashMap<>();
        Map<String, Long> reportsByStatus = new LinkedHashMap<>();
        Map<LocalDate, Long> reportsPerDay = new HashMap<>();

        for (RescueReport report : allReports) {
            ReportStatus status = report.getStatus();
            String statusName = status != null ? status.name() : "REPORTED";
            reportsByStatus.put(statusName, reportsByStatus.getOrDefault(statusName, 0L) + 1L);

            String type = report.getAnimalType() != null ? report.getAnimalType() : "Other";
            reportsByType.put(type, reportsByType.getOrDefault(type, 0L) + 1L);

            if (status == ReportStatus.REPORTED || status == ReportStatus.ASSIGNED ||
                status == ReportStatus.RESCUED || status == ReportStatus.UNDER_TREATMENT) {
                activeCases++;
            }

            if (status == ReportStatus.RESCUED || status == ReportStatus.UNDER_TREATMENT ||
                status == ReportStatus.RECOVERED || status == ReportStatus.LISTED_FOR_ADOPTION ||
                status == ReportStatus.ADOPTED) {
                rescuedCount++;
            }

            if (status == ReportStatus.UNDER_TREATMENT) {
                inTreatmentCount++;
            }

            if (report.getCreatedAt() != null) {
                LocalDate date = report.getCreatedAt().toLocalDate();
                reportsPerDay.put(date, reportsPerDay.getOrDefault(date, 0L) + 1L);
            }
        }

        long readyForAdoptionCount = adoptionAnimalRepository.countByStatus(AdoptionStatus.AVAILABLE);
        long adoptedCount = adoptionAnimalRepository.countByStatus(AdoptionStatus.ADOPTED);
        long volunteersCount = userRepository.countByRole(Role.ROLE_VOLUNTEER);

        List<Map<String, Object>> reportsByDay = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int offset = 6; offset >= 0; offset--) {
            LocalDate date = today.minusDays(offset);
            Map<String, Object> dayMap = new LinkedHashMap<>();
            dayMap.put("day", date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            dayMap.put("date", date.toString());
            dayMap.put("count", reportsPerDay.getOrDefault(date, 0L));
            reportsByDay.add(dayMap);
        }

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalReports(totalReports);
        stats.setActiveCases(activeCases);
        stats.setRescuedCount(rescuedCount);
        stats.setInTreatmentCount(inTreatmentCount);
        stats.setReadyForAdoptionCount(readyForAdoptionCount);
        stats.setAdoptedCount(adoptedCount);
        stats.setVolunteersCount(volunteersCount);
        stats.setReportsByType(reportsByType);
        stats.setReportsByStatus(reportsByStatus);
        stats.setReportsByDay(reportsByDay);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getVolunteers() {
        return userRepository.findByRole(Role.ROLE_VOLUNTEER)
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse approveVolunteer(Long volunteerId) {
        User volunteer = userRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found with id: " + volunteerId));

        if (volunteer.getRole() != Role.ROLE_VOLUNTEER) {
            throw new BadRequestException("User is not registered as a volunteer.");
        }

        volunteer.setApproved(true);
        return UserResponse.fromEntity(userRepository.save(volunteer));
    }

    @Transactional
    public UserResponse disableUser(Long userId, boolean disable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Cannot disable administrator account.");
        }

        user.setEnabled(!disable);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getRecoveredReportsForAdoption() {
        return reportRepository.findRecoveredAvailableForAdoption()
                .stream()
                .map(ReportResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
