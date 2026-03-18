package com.patrick.fintech.loan_backend.repository;

import com.patrick.fintech.loan_backend.model.Borrower;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowerRepository extends JpaRepository<Borrower, Long> {

    List<Borrower>  findByOrganization_Id(Long orgId);
    Page<Borrower>  findByOrganization_Id(Long orgId, Pageable pageable);

    // Duplicate checks — scoped per organization
    Optional<Borrower> findByNationalIdAndOrganization_Id(String nationalId, Long orgId);
    Optional<Borrower> findByPhoneAndOrganization_Id(String phone, Long orgId);
    Optional<Borrower> findByEmailAndOrganization_Id(String email, Long orgId);

    List<Borrower> findByOrganization_IdAndFirstNameContainingIgnoreCaseOrOrganization_IdAndLastNameContainingIgnoreCase(
        Long orgId1, String firstName, Long orgId2, String lastName);
}