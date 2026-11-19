package com.pawrescue.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pawrescue.model.ReportStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "status_histories")
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    @JsonIgnore
    private RescueReport report;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private ReportStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private ReportStatus newStatus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    public StatusHistory() {
    }

    public StatusHistory(RescueReport report, ReportStatus oldStatus, ReportStatus newStatus, User changedBy, String note) {
        this.report = report;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.note = note;
    }

    @PrePersist
    public void prePersist() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RescueReport getReport() {
        return report;
    }

    public void setReport(RescueReport report) {
        this.report = report;
    }

    public ReportStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(ReportStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public ReportStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ReportStatus newStatus) {
        this.newStatus = newStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(User changedBy) {
        this.changedBy = changedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}
