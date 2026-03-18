package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.model.LoanApproval;
import com.patrick.fintech.loan_backend.service.LoanApprovalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/loan-approvals")
public class LoanApprovalController {

    private final LoanApprovalService service;

    public LoanApprovalController(LoanApprovalService service) { this.service = service; }

    @PostMapping("/approve")
    public ResponseEntity<LoanApproval> approve(@RequestParam Long loanId,
            @RequestParam Long approverId, @RequestParam String decision,
            @RequestParam(required = false) String comment) {
        return ResponseEntity.ok(service.recordDecision(loanId, approverId, decision, comment));
    }

    @GetMapping("/loan/{loanId}") public ResponseEntity<List<LoanApproval>> getByLoan(@PathVariable Long loanId) { return ResponseEntity.ok(service.getByLoan(loanId)); }
    @GetMapping public ResponseEntity<List<LoanApproval>> getAll() { return ResponseEntity.ok(service.getAll()); }
}