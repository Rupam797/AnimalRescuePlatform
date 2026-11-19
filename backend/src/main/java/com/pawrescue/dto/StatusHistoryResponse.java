package com.pawrescue.dto;

import com.pawrescue.entity.StatusHistory;
import com.pawrescue.model.ReportStatus;

import java.time.LocalDateTime;

public class StatusHistoryResponse {

    private Long id;
    private ReportStatus oldStatus;
    private ReportStatus newStatus;
    private String changedByName;
    private String note;
    private LocalDateTime changedAt;

    public StatusHistoryResponse() {
    }

    public static StatusHistoryResponse fromEntity(StatusHistory history) {
        if (history == null) return null;
        StatusHistoryResponse dto = new StatusHistoryResponse();
        dto.setId(history.getId());
        dto.setOldStatus(history.getOldStatus());
        dto.setNewStatus(history.getNewStatus());
        dto.setChangedByName(history.getChangedBy() != null ? history.getChangedBy().getName() : "System");
        dto.setNote(history.getNote());
        dto.setChangedAt(history.getChangedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getChangedByName() {
        return changedByName;
    }

    public void setChangedByName(String changedByName) {
        this.changedByName = changedByName;
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
