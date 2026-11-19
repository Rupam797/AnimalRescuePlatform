package com.pawrescue.dto;

import com.pawrescue.model.ReportStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private ReportStatus status;

    private String note;

    public UpdateStatusRequest() {
    }

    public UpdateStatusRequest(ReportStatus status, String note) {
        this.status = status;
        this.note = note;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
