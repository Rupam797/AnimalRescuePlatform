package com.pawrescue.dto;

import jakarta.validation.constraints.NotNull;

public class AssignVolunteerRequest {

    @NotNull(message = "Volunteer ID is required")
    private Long volunteerId;

    private String notes;

    public AssignVolunteerRequest() {
    }

    public AssignVolunteerRequest(Long volunteerId, String notes) {
        this.volunteerId = volunteerId;
        this.notes = notes;
    }

    public Long getVolunteerId() {
        return volunteerId;
    }

    public void setVolunteerId(Long volunteerId) {
        this.volunteerId = volunteerId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
