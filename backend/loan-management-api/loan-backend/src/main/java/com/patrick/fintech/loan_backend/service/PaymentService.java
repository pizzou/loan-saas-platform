package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Payment;
import com.patrick.fintech.loan_backend.repository.PaymentRepository;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CurrentUserUtil currentUserUtil;

    /**
     * Get all payments for the current organization
     */
    public List<Payment> getByOrg(Long orgId) {
        return paymentRepository.findByLoan_Organization_Id(orgId);
    }

    /**
     * Get paginated payments
     */
    public List<Payment> getByOrg(Long orgId, int page, int size) {
        return paymentRepository.findByLoan_Organization_Id(orgId, org.springframework.data.domain.PageRequest.of(page, size))
                .getContent();
    }

    /**
     * Get all payments for a specific loan
     */
    public List<Payment> getByLoan(Long loanId) {
        return paymentRepository.findByLoanId(loanId);
    }

    /**
     * Get overdue payments for the current organization
     */
    public List<Payment> getOverdueByOrg(Long orgId) {
        return paymentRepository.findByOrganization_IdAndPaidFalseAndDueDateBefore(orgId, LocalDate.now());
    }

    /**
     * Record a payment (partial or full) with optional transaction info
     */
    @Transactional
    public Payment makePayment(Long paymentId, Double amount, String method, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        // Calculate any penalty first
        payment.calculatePenalty();

        // Record the actual payment
        payment.recordPayment(amount);

        // Set transaction info
        payment.setPaymentMethod(method);
        payment.setTransactionId(transactionId);
        if (payment.getPaid()) {
            payment.setPaidDate(LocalDate.now());
        }

        return paymentRepository.save(payment);
    }

    /**
     * Optional: Confirm payment from a gateway
     */
    @Transactional
    public Payment confirmPayment(Long paymentId, String transactionId, String method) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!payment.getPaid()) {
            payment.recordPayment(payment.getRemaining());
        }

        payment.setPaymentMethod(method);
        payment.setTransactionId(transactionId);
        payment.setPaidDate(LocalDate.now());

        return paymentRepository.save(payment);
    }
}
