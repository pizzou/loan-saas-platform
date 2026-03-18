package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.dto.PaymentGatewayRequest;
import com.patrick.fintech.loan_backend.dto.PaymentGatewayResponse;
import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class PaymentService {

    private static final double LATE_PENALTY_RATE = 0.02;

    private final PaymentRepository   paymentRepository;
    private final LoanRepository      loanRepository;
    private final FlutterwaveService  gatewayService;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository,
                          LoanRepository loanRepository,
                          FlutterwaveService gatewayService,
                          NotificationService notificationService) {
        this.paymentRepository   = paymentRepository;
        this.loanRepository      = loanRepository;
        this.gatewayService      = gatewayService;
        this.notificationService = notificationService;
    }



    /** Initiate via Flutterwave. Auto-confirms if gateway returns immediate success. */
    @Transactional
    public PaymentGatewayResponse initiateGatewayPayment(
            Long paymentId, PaymentGatewayRequest req) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        if (Boolean.TRUE.equals(payment.getPaid()))
            throw new RuntimeException("Payment already recorded");

        String currency = payment.getLoan() != null ? payment.getLoan().getCurrency() : "USD";
        String desc = "Loan installment #" + payment.getInstallmentNumber();

        PaymentGatewayResponse resp = gatewayService.initiatePayment(req, payment.getAmount(), currency, desc);

        if ("success".equals(resp.getStatus())) {
            confirmPayment(paymentId, resp.getTransactionId(), req.getPaymentMethod());
        }
        return resp;
    }

    /** Confirm after Flutterwave redirect/webhook — verifies with gateway before marking paid. */
    @Transactional
    public Payment confirmPayment(Long paymentId, String transactionId, String method) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        if (Boolean.TRUE.equals(payment.getPaid())) return payment;

        if (gatewayService.isConfigured() && !gatewayService.verifyTransaction(transactionId))
            throw new RuntimeException("Payment verification failed with gateway");

        payment.setPaid(true);
        payment.setPaidDate(LocalDate.now());
        payment.setTransactionId(transactionId);
        if (method != null) payment.setPaymentMethod(method);
        if (payment.getDueDate() != null && payment.getDueDate().isBefore(LocalDate.now())) {
            double base = payment.getAmount() != null ? payment.getAmount() : 0.0;
            payment.setPenalty(base * LATE_PENALTY_RATE);
        }
        Payment saved = paymentRepository.save(payment);
        autoCloseLoan(payment.getLoan().getId());
        try { notificationService.sendPaymentConfirmation(saved); } catch (Exception ignored) {}
        log.info("Payment confirmed: id={} txId={}", paymentId, transactionId);
        return saved;
    }

    public List<Payment> getOverdueByOrg(Long orgId) {
    return paymentRepository.findByOrganization_IdAndPaidFalseAndDueDateBefore(
        orgId, LocalDate.now());
}

    /** Legacy manual recording (cash payments). */
    @Transactional
    public Payment makePayment(Long paymentId, Double amount, String method, String txId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        if (Boolean.TRUE.equals(payment.getPaid()))
            throw new RuntimeException("Payment already recorded");
        payment.setPaid(true);
        payment.setPaidDate(LocalDate.now());
        if (method != null) payment.setPaymentMethod(method);
        if (txId   != null) payment.setTransactionId(txId);
        if (payment.getDueDate() != null && payment.getDueDate().isBefore(LocalDate.now())) {
            double base = amount != null ? amount : (payment.getAmount() != null ? payment.getAmount() : 0.0);
            payment.setPenalty(base * LATE_PENALTY_RATE);
        }
        Payment saved = paymentRepository.save(payment);
        autoCloseLoan(payment.getLoan().getId());
        try { notificationService.sendPaymentConfirmation(saved); } catch (Exception ignored) {}
        return saved;
    }

    public List<Payment> getByLoan(Long loanId) { return paymentRepository.findByLoanId(loanId); }
    public List<Payment> getByOrg(Long orgId)   { return paymentRepository.findByLoan_Organization_Id(orgId); }
    public List<Payment> getOverdue()           { return paymentRepository.findByPaidFalseAndDueDateBefore(LocalDate.now()); }

    private void autoCloseLoan(Long loanId) {
        List<Payment> all = paymentRepository.findByLoanId(loanId);
        if (!all.isEmpty() && all.stream().allMatch(p -> Boolean.TRUE.equals(p.getPaid()))) {
            loanRepository.findById(loanId).ifPresent(loan -> {
                if (loan.getStatus() == LoanStatus.APPROVED) {
                    loan.setStatus(LoanStatus.PAID);
                    loanRepository.save(loan);
                    log.info("Loan {} auto-closed as PAID", loanId);
                }
            });
        }
    }
}