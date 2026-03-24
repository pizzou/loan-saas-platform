package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.model.Audit;
import com.patrick.fintech.loan_backend.service.AuditService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final CurrentUserUtil currentUserUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Audit>>> getAll() {
        Long orgId = currentUserUtil.getCurrentOrganizationId();

        if (orgId == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Organization not found"));
        }

        List<Audit> logs = auditService.getByOrg(orgId);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
