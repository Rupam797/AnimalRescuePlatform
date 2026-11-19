package com.pawrescue.repository;

import com.pawrescue.entity.RescueReport;
import com.pawrescue.entity.User;
import com.pawrescue.model.ReportStatus;
import com.pawrescue.model.Severity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RescueReportRepository extends JpaRepository<RescueReport, Long> {

    List<RescueReport> findByReporterOrderByCreatedAtDesc(User reporter);

    List<RescueReport> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    long countByStatus(ReportStatus status);

    @Query("SELECT r FROM RescueReport r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:severity IS NULL OR r.severity = :severity) AND " +
           "(:search IS NULL OR LOWER(r.animalName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.animalType) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.address) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<RescueReport> findWithFilters(
            @Param("status") ReportStatus status,
            @Param("severity") Severity severity,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT r FROM RescueReport r JOIN r.assignments a WHERE a.volunteer = :volunteer ORDER BY r.createdAt DESC")
    List<RescueReport> findAssignedToVolunteer(@Param("volunteer") User volunteer);

    @Query("SELECT r FROM RescueReport r WHERE r.status = 'RECOVERED' AND NOT EXISTS (SELECT a FROM AdoptionAnimal a WHERE a.report = r)")
    List<RescueReport> findRecoveredAvailableForAdoption();

    List<RescueReport> findByCreatedAtAfter(LocalDateTime dateTime);
}
