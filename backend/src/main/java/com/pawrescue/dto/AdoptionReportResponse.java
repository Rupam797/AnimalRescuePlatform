package com.pawrescue.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AdoptionReportResponse {

    private long totalAdopted;
    private String fromDate;
    private String toDate;
    private Map<String, Long> speciesBreakdown;
    private List<AdoptedAnimalItemDto> animals;

    public AdoptionReportResponse() {
    }

    public AdoptionReportResponse(long totalAdopted, String fromDate, String toDate,
                                  Map<String, Long> speciesBreakdown, List<AdoptedAnimalItemDto> animals) {
        this.totalAdopted = totalAdopted;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.speciesBreakdown = speciesBreakdown;
        this.animals = animals;
    }

    public long getTotalAdopted() {
        return totalAdopted;
    }

    public void setTotalAdopted(long totalAdopted) {
        this.totalAdopted = totalAdopted;
    }

    public String getFromDate() {
        return fromDate;
    }

    public void setFromDate(String fromDate) {
        this.fromDate = fromDate;
    }

    public String getToDate() {
        return toDate;
    }

    public void setToDate(String toDate) {
        this.toDate = toDate;
    }

    public Map<String, Long> getSpeciesBreakdown() {
        return speciesBreakdown;
    }

    public void setSpeciesBreakdown(Map<String, Long> speciesBreakdown) {
        this.speciesBreakdown = speciesBreakdown;
    }

    public List<AdoptedAnimalItemDto> getAnimals() {
        return animals;
    }

    public void setAnimals(List<AdoptedAnimalItemDto> animals) {
        this.animals = animals;
    }

    public static class AdoptedAnimalItemDto {
        private Long id;
        private Long reportId;
        private String name;
        private String species;
        private String breed;
        private String age;
        private String gender;
        private String photoUrl;
        private LocalDateTime publishedAt;
        private LocalDateTime adoptedAt;
        private String adopterName;
        private String adopterEmail;
        private String adopterPhone;
        private Long daysToAdoption;

        public AdoptedAnimalItemDto() {
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

        public String getPhotoUrl() {
            return photoUrl;
        }

        public void setPhotoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
        }

        public LocalDateTime getPublishedAt() {
            return publishedAt;
        }

        public void setPublishedAt(LocalDateTime publishedAt) {
            this.publishedAt = publishedAt;
        }

        public LocalDateTime getAdoptedAt() {
            return adoptedAt;
        }

        public void setAdoptedAt(LocalDateTime adoptedAt) {
            this.adoptedAt = adoptedAt;
        }

        public String getAdopterName() {
            return adopterName;
        }

        public void setAdopterName(String adopterName) {
            this.adopterName = adopterName;
        }

        public String getAdopterEmail() {
            return adopterEmail;
        }

        public void setAdopterEmail(String adopterEmail) {
            this.adopterEmail = adopterEmail;
        }

        public String getAdopterPhone() {
            return adopterPhone;
        }

        public void setAdopterPhone(String adopterPhone) {
            this.adopterPhone = adopterPhone;
        }

        public Long getDaysToAdoption() {
            return daysToAdoption;
        }

        public void setDaysToAdoption(Long daysToAdoption) {
            this.daysToAdoption = daysToAdoption;
        }
    }
}
