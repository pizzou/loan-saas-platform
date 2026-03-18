package com.patrick.fintech.loan_backend.repository;

import com.patrick.fintech.loan_backend.model.LoanApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoanApprovalRepository extends JpaRepository<LoanApproval, Long> {
    List<LoanApproval> findByLoan_Id(Long loanId);
}