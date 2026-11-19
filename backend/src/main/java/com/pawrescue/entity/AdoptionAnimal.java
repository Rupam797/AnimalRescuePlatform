package com.pawrescue.entity;

import com.pawrescue.model.AdoptionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "adoption_animals")
public class AdoptionAnimal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rescue_report_id", unique = true)
    private RescueReport report;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String species;

    @Column(length = 100)
    private String breed;

    @Column(length = 50)
    private String age;

    @Column(length = 20)
    private String gender;

    @Column(name = "health_notes", columnDefinition = "TEXT")
    private String healthNotes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AdoptionStatus status = AdoptionStatus.AVAILABLE;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AdoptionRequest> requests = new ArrayList<>();

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    public AdoptionAnimal() {
    }

    @PrePersist
    public void prePersist() {
        if (publishedAt == null) {
            publishedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = AdoptionStatus.AVAILABLE;
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

    public List<AdoptionRequest> getRequests() {
        return requests;
    }

    public void setRequests(List<AdoptionRequest> requests) {
        this.requests = requests;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }
}
