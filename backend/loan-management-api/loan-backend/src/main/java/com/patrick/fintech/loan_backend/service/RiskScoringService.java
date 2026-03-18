package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.dto.RiskScoreResponse;
import com.patrick.fintech.loan_backend.model.Loan;
import com.patrick.fintech.loan_backend.model.LoanStatus;
import com.patrick.fintech.loan_backend.repository.LoanRepository;
import com.patrick.fintech.loan_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskScoringService {

    private final LoanRepository    loanRepository;
    private final PaymentRepository paymentRepository;

    public RiskScoreResponse score(Loan loan) {
        double repayment     = scoreRepaymentHistory(loan);
        double credit        = scoreCreditHistory(loan);
        double ltv           = scoreLtvFactor(loan);
        double kyc           = scoreKyc(loan);
        double concentration = scoreConcentration(loan);

        double total = Math.min(100, Math.max(0,
            repayment + credit + ltv + kyc + concentration));

        String category = total >= 75 ? "LOW"
                        : total >= 50 ? "MEDIUM"
                        : total >= 25 ? "HIGH"
                        : "CRITICAL";

        String recommendation = switch (category) {
            case "LOW"    -> "Approve. Low risk borrower with solid repayment history.";
            case "MEDIUM" -> "Approve with standard terms. Monitor repayments.";
            case "HIGH"   -> "Consider reduced amount or higher interest rate.";
            default       -> "Decline or require collateral. Very high default risk.";
        };

        log.info("Risk score for borrower={} : {} ({})",
            loan.getBorrower().getId(), String.format("%.1f", total), category);

        return new RiskScoreResponse(total, category, recommendation,
            repayment, credit, ltv, kyc, concentration);
    }

    private double scoreRepaymentHistory(Loan loan) {
        if (loan.getBorrower() == null || loan.getOrganization() == null) return 20.0;
        List<Loan> past = loanRepository.findByBorrowerIdAndOrganizationId(
            loan.getBorrower().getId(), loan.getOrganization().getId());
        if (past.isEmpty()) return 20.0;
        long total = 0, late = 0;
        for (Loan l : past) {
            var payments = paymentRepository.findByLoanId(l.getId());
            total += payments.size();
            late  += payments.stream()
                .filter(p -> Boolean.TRUE.equals(p.getPaid())
                          && p.getPaidDate() != null
                          && p.getPaidDate().isAfter(p.getDueDate()))
                .count();
        }
        if (total == 0) return 20.0;
        return (1.0 - ((double) late / total)) * 40.0;
    }

    private double scoreCreditHistory(Loan loan) {
        if (loan.getBorrower() == null) return 10.0;
        Integer cs = loan.getBorrower().getCreditScore();
        return cs == null ? 10.0 : (cs / 1000.0) * 25.0;
    }

    private double scoreLtvFactor(Loan loan) {
        if (loan.getBorrower() == null || loan.getOrganization() == null) return 15.0;
        double amount = loan.getAmount() != null ? loan.getAmount() : 0;
        List<Loan> past = loanRepository.findByBorrowerIdAndOrganizationId(
            loan.getBorrower().getId(), loan.getOrganization().getId());
        if (past.isEmpty()) return 15.0;
        double avg = past.stream()
            .mapToDouble(l -> l.getAmount() != null ? l.getAmount() : 0)
            .average().orElse(0);
        if (avg == 0) return 15.0;
        double ratio = amount / avg;
        if (ratio <= 1.0) return 20.0;
        if (ratio <= 2.0) return 14.0;
        if (ratio <= 3.0) return 7.0;
        return 2.0;
    }

    private double scoreKyc(Loan loan) {
        if (loan.getBorrower() == null) return 0.0;
        String status = loan.getBorrower().getKycStatus();
        if (status == null) return 0.0;
        return switch (status) {
            case "VERIFIED" -> 10.0;
            case "PENDING"  ->  4.0;
            default         ->  0.0;
        };
    }

    private double scoreConcentration(Loan loan) {
        if (loan.getBorrower() == null || loan.getOrganization() == null) return 5.0;
        long active = loanRepository.findByBorrowerIdAndOrganizationId(
                loan.getBorrower().getId(), loan.getOrganization().getId())
            .stream().filter(l -> l.getStatus() == LoanStatus.APPROVED).count();
        if (active == 0) return 5.0;
        if (active == 1) return 3.0;
        return 0.0;
    }
}