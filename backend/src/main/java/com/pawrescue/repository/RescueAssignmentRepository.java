package com.pawrescue.repository;

import com.pawrescue.entity.RescueAssignment;
import com.pawrescue.entity.RescueReport;
import com.pawrescue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RescueAssignmentRepository extends JpaRepository<RescueAssignment, Long> {
    List<RescueAssignment> findByReport(RescueReport report);
    List<RescueAssignment> findByVolunteerOrderByAssignedAtDesc(User volunteer);
    boolean existsByReportAndVolunteer(RescueReport report, User volunteer);
}
