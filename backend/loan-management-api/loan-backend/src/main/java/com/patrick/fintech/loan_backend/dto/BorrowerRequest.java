package com.patrick.fintech.loan_backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BorrowerRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Invalid email address")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "National ID is required")
    @Pattern(
        regexp = "^[0-9]{16}$",
        message = "National ID must be exactly 16 digits (numbers only)"
    )
    private String nationalId;

    private String address;

    @Min(value = 0,    message = "Credit score cannot be negative")
    @Max(value = 1000, message = "Credit score cannot exceed 1000")
    private Integer creditScore;
}