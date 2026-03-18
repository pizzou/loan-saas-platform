package com.patrick.fintech.loan_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "borrower_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BorrowerFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileType;
    private Long   fileSize;

    @Column(columnDefinition = "BYTEA")
    @JsonIgnore
    private byte[] data;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrower_id")
    @JsonIgnoreProperties({"organization", "hibernateLazyInitializer", "handler"})
    private Borrower borrower;
}