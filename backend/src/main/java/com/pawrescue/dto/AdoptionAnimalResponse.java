package com.pawrescue.dto;

import com.pawrescue.entity.AdoptionAnimal;
import com.pawrescue.model.AdoptionStatus;

import java.time.LocalDateTime;

public class AdoptionAnimalResponse {

    private Long id;
    private Long reportId;
    private String name;
    private String species;
    private String breed;
    private String age;
    private String gender;
    private String healthNotes;
    private String description;
    private String photoUrl;
    private AdoptionStatus status;
    private LocalDateTime publishedAt;

    public AdoptionAnimalResponse() {
    }

    public static AdoptionAnimalResponse fromEntity(AdoptionAnimal animal) {
        if (animal == null) return null;
        AdoptionAnimalResponse dto = new AdoptionAnimalResponse();
        dto.setId(animal.getId());
        if (animal.getReport() != null) {
            dto.setReportId(animal.getReport().getId());
        }
        dto.setName(animal.getName());
        dto.setSpecies(animal.getSpecies());
        dto.setBreed(animal.getBreed());
        dto.setAge(animal.getAge());
        dto.setGender(animal.getGender());
        dto.setHealthNotes(animal.getHealthNotes());
        dto.setDescription(animal.getDescription());
        dto.setPhotoUrl(animal.getPhotoUrl());
        dto.setStatus(animal.getStatus());
        dto.setPublishedAt(animal.getPublishedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getReportId() {
        return reportId;
    }

    public void setReportId(Long reportId) {
        this.reportId = reportId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getHealthNotes() {
        return healthNotes;
    }

    public void setHealthNotes(String healthNotes) {
        this.healthNotes = healthNotes;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public AdoptionStatus getStatus() {
        return status;
    }

    public void setStatus(AdoptionStatus status) {
        this.status = status;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }
}
