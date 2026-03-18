package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "loans", indexes = {
    @Index(name = "idx_loans_org",      columnList = "organization_id"),
    @Index(name = "idx_loans_borrower", columnList = "borrower_id"),
    @Index(name = "idx_loans_status",   columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double    amount;
    private Double    interestRate;
    private Integer   durationMonths;
    private String    currency;
    private LocalDate startDate;
    private String    notes;
    private String    rejectionReason;
    private Double    riskScore;
    private String    riskCategory;
    private Double    collateralValue;
    private String    collateralDescription;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrower_id")
    @JsonIgnoreProperties({"organization","hibernateLazyInitializer","handler"})
    private Borrower borrower;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Payment> payments;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_user_id")
    @JsonIgnoreProperties({"organization","password","role","hibernateLazyInitializer","handler"})
    private User approvedBy;

    private LocalDate     approvedAt;
    private LocalDateTime createdAt = LocalDateTime.now();
}