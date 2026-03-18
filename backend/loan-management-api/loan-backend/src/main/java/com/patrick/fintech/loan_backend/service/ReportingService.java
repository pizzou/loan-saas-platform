package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Loan;
import com.patrick.fintech.loan_backend.model.Payment;
import com.patrick.fintech.loan_backend.repository.LoanRepository;
import com.patrick.fintech.loan_backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportingService {

    private final LoanRepository loanRepository;
    private final PaymentRepository paymentRepository;

    public ReportingService(LoanRepository loanRepository, PaymentRepository paymentRepository) {
        this.loanRepository = loanRepository;
        this.paymentRepository = paymentRepository;
    }

    public Map<String, Long> loanStatusReport(Long organizationId) {
        List<Loan> loans = loanRepository.findByOrganization_Id(organizationId);
        return loans.stream().collect(Collectors.groupingBy(
            loan -> loan.getStatus().name(), Collectors.counting()));
    }

    public Map<String, Double> paymentReport(Long organizationId) {
        List<Payment> payments = paymentRepository.findByLoan_Organization_Id(organizationId);

        double totalPaid = payments.stream()
            .filter(p -> Boolean.TRUE.equals(p.getPaid()))
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

        double totalPending = payments.stream()
            .filter(p -> !Boolean.TRUE.equals(p.getPaid()))
            .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();

        double totalPenalties = payments.stream()
            .mapToDouble(p -> p.getPenalty() != null ? p.getPenalty() : 0.0).sum();

        return Map.of("totalPaid", totalPaid, "totalPending", totalPending, "totalPenalties", totalPenalties);
    }
}