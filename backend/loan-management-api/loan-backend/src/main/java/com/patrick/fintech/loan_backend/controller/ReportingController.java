package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.service.ReportingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/loans/{orgId}")
    public ResponseEntity<Map<String, Long>> loanStatusReport(@PathVariable Long orgId) {
        return ResponseEntity.ok(reportingService.loanStatusReport(orgId));
    }

    @GetMapping("/payments/{orgId}")
    public ResponseEntity<Map<String, Double>> paymentReport(@PathVariable Long orgId) {
        return ResponseEntity.ok(reportingService.paymentReport(orgId));
    }
}