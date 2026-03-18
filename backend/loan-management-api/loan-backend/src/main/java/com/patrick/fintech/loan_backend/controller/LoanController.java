package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.dto.LoanRequest;
import com.patrick.fintech.loan_backend.dto.RiskScoreResponse;
import com.patrick.fintech.loan_backend.model.Loan;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.service.LoanService;
import com.patrick.fintech.loan_backend.service.RiskScoringService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService        loanService;
    private final RiskScoringService riskScoringService;
    private final CurrentUserUtil    currentUserUtil;

    @PostMapping
    @PreAuthorize("hasAnyRole('LOAN_OFFICER','ADMIN')")
    public ResponseEntity<ApiResponse<Loan>> createLoan(@Valid @RequestBody LoanRequest req) {
        Loan loan = loanService.createLoan(req, currentUserUtil.getCurrentOrganizationId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Loan created", loan));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Loan>>> getLoans() {
        return ResponseEntity.ok(ApiResponse.ok(
            loanService.getLoansByOrganization(currentUserUtil.getCurrentOrganizationId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Loan>> getLoanById(@PathVariable Long id) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoanByIdForOrg(id, orgId)));
    }

    @GetMapping("/borrower/{borrowerId}")
    public ResponseEntity<ApiResponse<List<Loan>>> getLoansByBorrower(
            @PathVariable Long borrowerId) {
        return ResponseEntity.ok(ApiResponse.ok(
            loanService.getLoansByBorrower(borrowerId, currentUserUtil.getCurrentOrganizationId())));
    }

    @GetMapping("/{id}/risk")
    public ResponseEntity<ApiResponse<RiskScoreResponse>> getRiskScore(@PathVariable Long id) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        Loan loan  = loanService.getLoanByIdForOrg(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok(riskScoringService.score(loan)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Loan>> approveLoan(@PathVariable Long id) {
        Long orgId    = currentUserUtil.getCurrentOrganizationId();
        User approver = currentUserUtil.getCurrentUser();
        loanService.getLoanByIdForOrg(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok("Loan approved", loanService.approveLoan(id, approver)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Loan>> rejectLoan(@PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        loanService.getLoanByIdForOrg(id, orgId);
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(ApiResponse.ok("Loan rejected", loanService.rejectLoan(id, reason)));
    }
}