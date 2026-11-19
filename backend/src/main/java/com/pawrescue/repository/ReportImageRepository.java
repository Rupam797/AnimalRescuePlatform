package com.pawrescue.repository;

import com.pawrescue.entity.ReportImage;
import com.pawrescue.entity.RescueReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportImageRepository extends JpaRepository<ReportImage, Long> {
    List<ReportImage> findByReport(RescueReport report);
}
