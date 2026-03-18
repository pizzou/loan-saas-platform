package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.dto.BorrowerRequest;
import com.patrick.fintech.loan_backend.model.Borrower;
import com.patrick.fintech.loan_backend.service.BorrowerService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/borrowers")
@RequiredArgsConstructor
public class BorrowerController {

    private final BorrowerService service;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<Borrower>> create(
            @Valid @RequestBody BorrowerRequest req) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        Borrower b = new Borrower();
        b.setFirstName(req.getFirstName()); b.setLastName(req.getLastName());
        b.setEmail(req.getEmail());         b.setPhone(req.getPhone());
        b.setNationalId(req.getNationalId()); b.setAddress(req.getAddress());
        b.setCreditScore(req.getCreditScore());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Borrower created", service.create(b, orgId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Borrower>>> list(
            @RequestParam(required = false) String search) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        List<Borrower> result = search != null
            ? service.search(orgId, search) : service.listByOrg(orgId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Borrower>> getById(@PathVariable Long id) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        return ResponseEntity.ok(ApiResponse.ok(service.getByIdForOrg(id, orgId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Borrower>> update(
            @PathVariable Long id,
            @Valid @RequestBody BorrowerRequest req) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        service.getByIdForOrg(id, orgId);
        Borrower b = new Borrower();
        b.setFirstName(req.getFirstName()); b.setLastName(req.getLastName());
        b.setPhone(req.getPhone());         b.setEmail(req.getEmail());
        b.setNationalId(req.getNationalId()); b.setAddress(req.getAddress());
        b.setCreditScore(req.getCreditScore());
        return ResponseEntity.ok(ApiResponse.ok("Updated", service.update(id, b)));
    }
}