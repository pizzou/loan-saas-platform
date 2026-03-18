package com.patrick.fintech.loan_backend.repository;

import com.patrick.fintech.loan_backend.model.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByLoanId(Long loanId);
    List<Payment> findByLoan_Organization_Id(Long orgId);
    Page<Payment> findByLoan_Organization_Id(Long orgId, Pageable pageable);
    List<Payment> findByPaidFalseAndDueDateBefore(LocalDate date);
    List<Payment> findByOrganization_IdAndPaidFalseAndDueDateBefore(Long orgId, LocalDate date);
}