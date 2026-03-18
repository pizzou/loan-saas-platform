package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.dto.LoanRequest;
import com.patrick.fintech.loan_backend.dto.RiskScoreResponse;
import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock LoanRepository         loanRepository;
    @Mock OrganizationRepository organizationRepository;
    @Mock PaymentRepository      paymentRepository;
    @Mock BorrowerRepository     borrowerRepository;
    @Mock RiskScoringService     riskScoringService;
    @Mock NotificationService    notificationService;
    @InjectMocks LoanService loanService;

    private Organization org;
    private Borrower     borrower;

    @BeforeEach
    void setUp() {
        org = new Organization(); org.setId(1L); org.setName("TestOrg");
        borrower = new Borrower(); borrower.setId(1L);
        borrower.setFirstName("John"); borrower.setLastName("Doe");
        borrower.setKycStatus("VERIFIED"); borrower.setCreditScore(750);
    }

    @Test
    void createLoan_shouldSaveLoan_withAllFields() {
        LoanRequest req = new LoanRequest();
        req.setBorrowerId(1L); req.setAmount(10000.0);
        req.setInterestRate(12.0); req.setDurationMonths(12);
        req.setCurrency("USD"); req.setStartDate("2026-01-01");
        req.setCollateralValue(15000.0);
        req.setCollateralDescription("Land title");

        Loan savedLoan = new Loan();
        savedLoan.setId(1L); savedLoan.setBorrower(borrower);
        savedLoan.setOrganization(org); savedLoan.setAmount(10000.0);
        savedLoan.setStatus(LoanStatus.PENDING);

        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));
        when(borrowerRepository.findById(1L)).thenReturn(Optional.of(borrower));
        when(loanRepository.save(any())).thenReturn(savedLoan);
        when(riskScoringService.score(any())).thenReturn(
            new RiskScoreResponse(80.0, "LOW", "Approve", 32.0, 18.75, 15.0, 10.0, 5.0));

        Loan result = loanService.createLoan(req, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(LoanStatus.PENDING);
        verify(loanRepository, times(2)).save(any());
    }

    @Test
    void createLoan_shouldThrow_whenBorrowerNotFound() {
        LoanRequest req = new LoanRequest();
        req.setBorrowerId(99L); req.setAmount(1000.0);
        req.setInterestRate(10.0); req.setDurationMonths(6);
        req.setCurrency("USD"); req.setStartDate("2026-01-01");

        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));
        when(borrowerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loanService.createLoan(req, 1L))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Borrower not found");
    }

    @Test
    void approveLoan_shouldSetStatusApproved_andGenerateSchedule() {
        Loan loan = new Loan();
        loan.setId(1L); loan.setStatus(LoanStatus.PENDING);
        loan.setAmount(12000.0); loan.setInterestRate(12.0);
        loan.setDurationMonths(12);
        loan.setStartDate(java.time.LocalDate.of(2026, 1, 1));
        loan.setBorrower(borrower); loan.setOrganization(org);

        User approver = new User(); approver.setId(1L); approver.setName("Admin");

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any())).thenReturn(loan);
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Loan result = loanService.approveLoan(1L, approver);

        assertThat(result.getStatus()).isEqualTo(LoanStatus.APPROVED);
        verify(paymentRepository, times(12)).save(any());
    }

    @Test
    void approveLoan_shouldThrow_whenAlreadyApproved() {
        Loan loan = new Loan(); loan.setId(1L);
        loan.setStatus(LoanStatus.APPROVED);
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        assertThatThrownBy(() -> loanService.approveLoan(1L, new User()))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Already approved");
    }
}