package com.patrick.fintech.loan_backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoanRequest {
    @NotNull(message = "Borrower ID is required")
    private Long borrowerId;

    @NotNull @DecimalMin("1.0")
    private Double amount;

    @NotNull @DecimalMin("0.01") @DecimalMax("100.0")
    private Double interestRate;

    @NotNull @Min(1) @Max(360)
    private Integer durationMonths;

    @NotBlank @Size(min = 3, max = 3)
    private String currency;

    @NotBlank
    private String startDate;

    private String notes;
    private Double collateralValue;
    private String collateralDescription;
}