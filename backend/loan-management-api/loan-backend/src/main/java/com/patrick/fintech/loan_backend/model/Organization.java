package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
@Table(name = "organizations")
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String industry;

    @OneToMany(mappedBy = "organization")
    @JsonIgnore
    private List<User> users;

    @OneToMany(mappedBy = "organization")
    @JsonIgnore
    private List<Loan> loans;
}
