package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.dto.DashboardStats;
import com.patrick.fintech.loan_backend.model.LoanStatus;
import com.patrick.fintech.loan_backend.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class DashboardService {

    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;
    private final BorrowerRepository borrowerRepository;

    public DashboardService(LoanRepository l, PaymentRepository p, BorrowerRepository b) {
        this.loanRepository = l; this.paymentRepository = p; this.borrowerRepository = b;
    }

    public DashboardStats getStats(Long orgId) {
        long totalLoans    = loanRepository.countByOrganization_Id(orgId);
        long activeLoans   = loanRepository.countByOrganization_IdAndStatus(orgId, LoanStatus.APPROVED);
        long pendingLoans  = loanRepository.countByOrganization_IdAndStatus(orgId, LoanStatus.PENDING);
        long rejectedLoans = loanRepository.countByOrganization_IdAndStatus(orgId, LoanStatus.REJECTED);
        long closedLoans   = loanRepository.countByOrganization_IdAndStatus(orgId, LoanStatus.PAID);
        long totalBorrowers = borrowerRepository.findByOrganization_Id(orgId).size();

        double totalAmountLent = loanRepository.findByOrganization_Id(orgId).stream()
            .mapToDouble(l -> l.getAmount() != null ? l.getAmount() : 0.0).sum();

        double paymentsCollected = paymentRepository.findByLoan_Organization_Id(orgId).stream()
            .filter(p -> Boolean.TRUE.equals(p.getPaid()))
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

        double penaltiesCollected = paymentRepository.findByLoan_Organization_Id(orgId).stream()
            .filter(p -> Boolean.TRUE.equals(p.getPaid()))
            .mapToDouble(p -> p.getPenalty() != null ? p.getPenalty() : 0.0).sum();

        long overduePayments = paymentRepository
            .findByOrganization_IdAndPaidFalseAndDueDateBefore(orgId, LocalDate.now()).size();

        return new DashboardStats(totalLoans, activeLoans, pendingLoans, rejectedLoans,
            closedLoans, totalBorrowers, overduePayments,
            totalAmountLent, paymentsCollected, penaltiesCollected);
    }
}