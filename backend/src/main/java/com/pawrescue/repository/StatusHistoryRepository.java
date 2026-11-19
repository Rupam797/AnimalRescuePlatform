package com.pawrescue.repository;

import com.pawrescue.entity.RescueReport;
import com.pawrescue.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByReportOrderByChangedAtAsc(RescueReport report);
}
