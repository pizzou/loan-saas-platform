package com.patrick.fintech.loan_backend.repository;

import com.patrick.fintech.loan_backend.model.Loan;
import com.patrick.fintech.loan_backend.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByOrganization_Id(Long orgId);
    Page<Loan> findByOrganization_Id(Long orgId, Pageable pageable);
    List<Loan> findByBorrower_Id(Long borrowerId);
    List<Loan> findByBorrowerIdAndOrganizationId(Long borrowerId, Long orgId);
    List<Loan> findByStatus(LoanStatus status);
    long countByStatus(LoanStatus status);
    long countByOrganization_Id(Long orgId);
    long countByOrganization_IdAndStatus(Long orgId, LoanStatus status);
}