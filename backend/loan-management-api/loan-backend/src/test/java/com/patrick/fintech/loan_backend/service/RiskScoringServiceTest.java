package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.dto.RiskScoreResponse;
import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskScoringServiceTest {

    @Mock LoanRepository    loanRepository;
    @Mock PaymentRepository paymentRepository;
    @InjectMocks RiskScoringService riskScoringService;

    @Test
    void score_shouldReturnLowRisk_forExcellentBorrower() {
        Organization org = new Organization(); org.setId(1L);
        Borrower borrower = new Borrower();
        borrower.setId(1L); borrower.setCreditScore(900);
        borrower.setKycStatus("VERIFIED");
        Loan loan = new Loan();
        loan.setId(1L); loan.setAmount(5000.0);
        loan.setBorrower(borrower); loan.setOrganization(org);

        when(loanRepository.findByBorrowerIdAndOrganizationId(1L, 1L)).thenReturn(List.of());

        RiskScoreResponse result = riskScoringService.score(loan);

        assertThat(result.getScore()).isGreaterThanOrEqualTo(50.0);
        assertThat(result.getCategory()).isIn("LOW", "MEDIUM");
        assertThat(result.getRecommendation()).isNotBlank();
    }

    @Test
    void score_shouldReturnHighRisk_forUnverifiedNoCreditBorrower() {
        Organization org = new Organization(); org.setId(1L);
        Borrower borrower = new Borrower();
        borrower.setId(1L); borrower.setCreditScore(100);
        borrower.setKycStatus("REJECTED");
        Loan loan = new Loan();
        loan.setId(1L); loan.setAmount(50000.0);
        loan.setBorrower(borrower); loan.setOrganization(org);

        when(loanRepository.findByBorrowerIdAndOrganizationId(1L, 1L)).thenReturn(List.of());

        RiskScoreResponse result = riskScoringService.score(loan);

        assertThat(result.getScore()).isLessThan(50.0);
        assertThat(result.getCategory()).isIn("HIGH", "CRITICAL");
    }
}