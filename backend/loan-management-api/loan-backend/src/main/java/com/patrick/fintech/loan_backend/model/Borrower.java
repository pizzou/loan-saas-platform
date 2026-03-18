package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "borrowers", indexes = {
    @Index(name = "idx_borrowers_org", columnList = "organization_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Borrower {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String  firstName;
    private String  lastName;
    private String  email;
    private String  phone;
    private String  nationalId;
    private String  address;
    private Integer creditScore;
    private String  kycStatus = "PENDING";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    @JsonIgnore
    private Organization organization;
}