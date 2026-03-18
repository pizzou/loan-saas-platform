package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock LoanRepository    loanRepository;
    @InjectMocks PaymentService paymentService;

    @Test
    void makePayment_shouldMarkPaid_andSetPaidDate() {
        Loan loan = new Loan(); loan.setId(1L); loan.setStatus(LoanStatus.APPROVED);
        Payment payment = new Payment();
        payment.setId(1L); payment.setPaid(false);
        payment.setAmount(1000.0); payment.setPenalty(0.0);
        payment.setDueDate(LocalDate.now().plusDays(5));
        payment.setLoan(loan);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.findByLoanId(1L)).thenReturn(List.of(payment));
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        Payment result = paymentService.makePayment(1L, 1000.0, "CASH", null);

        assertThat(result.getPaid()).isTrue();
        assertThat(result.getPaidDate()).isEqualTo(LocalDate.now());
        assertThat(result.getPenalty()).isEqualTo(0.0);
    }

    @Test
    void makePayment_shouldApplyPenalty_whenOverdue() {
        Loan loan = new Loan(); loan.setId(1L); loan.setStatus(LoanStatus.APPROVED);
        Payment payment = new Payment();
        payment.setId(1L); payment.setPaid(false);
        payment.setAmount(1000.0); payment.setPenalty(0.0);
        payment.setDueDate(LocalDate.now().minusDays(10));
        payment.setLoan(loan);

        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.findByLoanId(1L)).thenReturn(List.of(payment));
        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        Payment result = paymentService.makePayment(1L, 1000.0, "CASH", null);

        assertThat(result.getPaid()).isTrue();
        assertThat(result.getPenalty()).isGreaterThan(0.0);
    }

    @Test
    void makePayment_shouldThrow_whenAlreadyPaid() {
        Payment payment = new Payment(); payment.setId(1L); payment.setPaid(true);
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(payment));
        assertThatThrownBy(() -> paymentService.makePayment(1L, 100.0, "CASH", null))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("already recorded");
    }
}