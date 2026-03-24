package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payments_loan", columnList = "loan_id"),
        @Index(name = "idx_payments_org", columnList = "organization_id"),
        @Index(name = "idx_payments_due", columnList = "due_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;            // full installment amount
    private Double paidAmount = 0.0;  // amount actually paid so far
    private Double penalty = 0.0;

    private LocalDate dueDate;
    private LocalDate paidDate;

    private Boolean paid = false;

    private String paymentMethod;
    private String transactionId;
    private Integer installmentNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "loan_id")
    @JsonIgnoreProperties({"payments","organization","approvedBy","hibernateLazyInitializer","handler"})
    private Loan loan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;

    // Record partial or full payment
    public void recordPayment(Double paymentAmount) {
        if (paymentAmount == null || paymentAmount <= 0) return;

        this.paidAmount += paymentAmount;

        // Mark as paid if total paid covers installment + penalty
        if (this.paidAmount >= (this.amount + this.penalty)) {
            this.paid = true;
            this.paidDate = LocalDate.now();
        }
    }

    // Remaining amount including penalty
    public Double remaining() {
        return Math.max((amount + penalty) - paidAmount, 0);
    }

    // Calculate penalty for overdue payments (example: 1% per day late)
    public void calculatePenalty() {
        if (dueDate.isBefore(LocalDate.now()) && !paid) {
            long daysLate = java.time.temporal.ChronoUnit.DAYS.between(dueDate, LocalDate.now());
            this.penalty = amount * 0.01 * daysLate;
        }
    }
}
