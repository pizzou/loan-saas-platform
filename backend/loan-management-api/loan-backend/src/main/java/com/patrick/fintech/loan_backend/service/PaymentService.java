package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Payment;
import com.patrick.fintech.loan_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public List<Payment> getByLoan(Long loanId) {
        return paymentRepository.findByLoanId(loanId);
    }

    public List<Payment> getByOrg(Long orgId) {
        return paymentRepository.findByLoan_Organization_Id(orgId);
    }

    public List<Payment> getOverdueByOrg(Long orgId) {
        return paymentRepository.findByOrganization_IdAndPaidFalseAndDueDateBefore(orgId, LocalDate.now());
    }

    @Transactional
    public Payment makePayment(Long paymentId, Double amount, String method, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        payment.calculatePenalty(); // calculate any overdue penalties
        payment.recordPayment(amount);

        payment.setPaymentMethod(method);
        payment.setTransactionId(transactionId);

        return paymentRepository.save(payment);
    }
}
