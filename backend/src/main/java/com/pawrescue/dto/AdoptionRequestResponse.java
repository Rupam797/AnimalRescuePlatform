package com.pawrescue.dto;

import com.pawrescue.entity.AdoptionRequest;
import com.pawrescue.model.AdoptionRequestStatus;

import java.time.LocalDateTime;

public class AdoptionRequestResponse {

    private Long id;
    private AdoptionAnimalResponse animal;
    private UserResponse user;
    private String message;
    private String phone;
    private AdoptionRequestStatus status;
    private LocalDateTime createdAt;

    public AdoptionRequestResponse() {
    }

    public static AdoptionRequestResponse fromEntity(AdoptionRequest request) {
        if (request == null) return null;
        AdoptionRequestResponse dto = new AdoptionRequestResponse();
        dto.setId(request.getId());
        dto.setAnimal(AdoptionAnimalResponse.fromEntity(request.getAnimal()));
        dto.setUser(UserResponse.fromEntity(request.getUser()));
        dto.setMessage(request.getMessage());
        dto.setPhone(request.getPhone());
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AdoptionAnimalResponse getAnimal() {
        return animal;
    }

    public void setAnimal(AdoptionAnimalResponse animal) {
        this.animal = animal;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public AdoptionRequestStatus getStatus() {
        return status;
    }

    public void setStatus(AdoptionRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
