package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.dto.ApiResponse;
import com.patrick.fintech.loan_backend.dto.RegisterRequest;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.service.AuthService;
import com.patrick.fintech.loan_backend.service.UserService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService      userService;
    private final AuthService      authService;
    private final CurrentUserUtil  currentUserUtil;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @Valid @RequestBody RegisterRequest req) {
        if (req.getOrganizationId() == null)
            req.setOrganizationId(currentUserUtil.getCurrentOrganizationId());
        User user = authService.register(req);
        return ResponseEntity.ok(ApiResponse.ok("User created", safeUser(user)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAll() {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        List<Map<String, Object>> users = userService.getAll().stream()
            .filter(u -> u.getOrganization() != null
                      && u.getOrganization().getId().equals(orgId))
            .map(this::safeUser)
            .toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        Long orgId = currentUserUtil.getCurrentOrganizationId();
        User user  = userService.getById(id);
        if (!user.getOrganization().getId().equals(orgId))
            throw new RuntimeException("User not found: " + id);
        return ResponseEntity.ok(ApiResponse.ok(safeUser(user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User user = userService.getById(id);
        if (body.containsKey("name") && body.get("name") != null)
            user.setName(body.get("name"));
        if (body.containsKey("password") && body.get("password") != null
                && !body.get("password").isBlank())
            user = userService.updatePassword(id, body.get("password"));
        User saved = userService.update(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Updated", safeUser(saved)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Long currentId = currentUserUtil.getCurrentUserId();
        if (currentId != null && currentId.equals(id))
            throw new RuntimeException("You cannot delete your own account");
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newPw = body.get("newPassword");
        if (newPw == null || newPw.length() < 6)
            throw new RuntimeException("Password must be at least 6 characters");
        userService.updatePassword(id, newPw);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully"));
    }

    private Map<String, Object> safeUser(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           u.getId());
        m.put("name",         u.getName());
        m.put("email",        u.getEmail());
        m.put("role",         u.getRole() != null ? Map.of(
            "id", u.getRole().getId(), "name", u.getRole().getName().name()) : null);
        m.put("organization", u.getOrganization() != null ? Map.of(
            "id", u.getOrganization().getId(), "name", u.getOrganization().getName()) : null);
        return m;
    }
}