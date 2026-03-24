package com.patrick.fintech.loan_backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class PaymentRequest {
    @NotNull
    private Double amount;

    @NotNull
    private String paymentMethod;

    private String transactionId;
}
