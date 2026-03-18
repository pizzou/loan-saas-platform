package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_loan", columnList = "loan_id"),
    @Index(name = "idx_payments_org",  columnList = "organization_id"),
    @Index(name = "idx_payments_due",  columnList = "due_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double    amount;
    private Double    penalty = 0.0;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private Boolean   paid = false;
    private String    paymentMethod;
    private String    transactionId;
    private Integer   installmentNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "loan_id")
    @JsonIgnoreProperties({"payments","organization","approvedBy","hibernateLazyInitializer","handler"})
    private Loan loan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;
}