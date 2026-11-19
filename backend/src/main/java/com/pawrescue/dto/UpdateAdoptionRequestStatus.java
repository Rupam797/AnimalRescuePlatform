package com.pawrescue.dto;

import com.pawrescue.model.AdoptionRequestStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAdoptionRequestStatus {

    @NotNull(message = "Status is required")
    private AdoptionRequestStatus status;

    public UpdateAdoptionRequestStatus() {
    }

    public UpdateAdoptionRequestStatus(AdoptionRequestStatus status) {
        this.status = status;
    }

    public AdoptionRequestStatus getStatus() {
        return status;
    }

    public void setStatus(AdoptionRequestStatus status) {
        this.status = status;
    }
}
