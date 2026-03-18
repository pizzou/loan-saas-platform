package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.dto.PaymentGatewayRequest;
import com.patrick.fintech.loan_backend.dto.PaymentGatewayResponse;
import com.patrick.fintech.loan_backend.dto.PaymentRequest;
import com.patrick.fintech.loan_backend.model.Payment;
import com.patrick.fintech.loan_backend.service.PaymentService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService  paymentService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping("/initiate/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentGatewayResponse>> initiatePayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentGatewayRequest req) {
        req.setPaymentId(paymentId);
        PaymentGatewayResponse resp = paymentService.initiateGatewayPayment(paymentId, req);
        return ResponseEntity.ok(ApiResponse.ok("Payment initiated", resp));
    }

    @PostMapping("/confirm/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> confirmPayment(
            @PathVariable Long paymentId,
            @RequestParam String transactionId,
            @RequestParam(required = false) String method) {
        Payment p = paymentService.confirmPayment(paymentId, transactionId, method);
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed", p));
    }

    @PostMapping("/pay/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> makePayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRequest req) {
        Payment p = paymentService.makePayment(
            paymentId, req.getAmount(), req.getPaymentMethod(), req.getTransactionId());
        return ResponseEntity.ok(ApiResponse.ok("Payment recorded", p));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getByOrg(orgId)));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getByLoan(loanId)));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<Payment>>> getOverdue() {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getOverdueByOrg(orgId)));
    }
}