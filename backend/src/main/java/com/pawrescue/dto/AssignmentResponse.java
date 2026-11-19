package com.pawrescue.dto;

import com.pawrescue.entity.RescueAssignment;

import java.time.LocalDateTime;

public class AssignmentResponse {

    private Long id;
    private Long volunteerId;
    private String volunteerName;
    private String volunteerEmail;
    private String volunteerPhone;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private String notes;

    public AssignmentResponse() {
    }

    public static AssignmentResponse fromEntity(RescueAssignment assignment) {
        if (assignment == null) return null;
        AssignmentResponse dto = new AssignmentResponse();
        dto.setId(assignment.getId());
        if (assignment.getVolunteer() != null) {
            dto.setVolunteerId(assignment.getVolunteer().getId());
            dto.setVolunteerName(assignment.getVolunteer().getName());
            dto.setVolunteerEmail(assignment.getVolunteer().getEmail());
            dto.setVolunteerPhone(assignment.getVolunteer().getPhone());
        }
        if (assignment.getAssignedBy() != null) {
            dto.setAssignedByName(assignment.getAssignedBy().getName());
        }
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setNotes(assignment.getNotes());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVolunteerId() {
        return volunteerId;
    }

    public void setVolunteerId(Long volunteerId) {
        this.volunteerId = volunteerId;
    }

    public String getVolunteerName() {
        return volunteerName;
    }

    public void setVolunteerName(String volunteerName) {
        this.volunteerName = volunteerName;
    }

    public String getVolunteerEmail() {
        return volunteerEmail;
    }

    public void setVolunteerEmail(String volunteerEmail) {
        this.volunteerEmail = volunteerEmail;
    }

    public String getVolunteerPhone() {
        return volunteerPhone;
    }

    public void setVolunteerPhone(String volunteerPhone) {
        this.volunteerPhone = volunteerPhone;
    }

    public String getAssignedByName() {
        return assignedByName;
    }

    public void setAssignedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
