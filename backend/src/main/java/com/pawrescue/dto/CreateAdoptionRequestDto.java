package com.pawrescue.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateAdoptionRequestDto {

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Contact phone is required")
    private String phone;

    public CreateAdoptionRequestDto() {
    }

    public CreateAdoptionRequestDto(String message, String phone) {
        this.message = message;
        this.phone = phone;
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
}
