package com.patrick.fintech.loan_backend.controller;

import com.patrick.fintech.loan_backend.model.Role;
import com.patrick.fintech.loan_backend.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) { this.roleService = roleService; }

    @PostMapping public ResponseEntity<Role> create(@RequestBody Role role) { return ResponseEntity.ok(roleService.save(role)); }
    @GetMapping  public ResponseEntity<List<Role>> getAll() { return ResponseEntity.ok(roleService.getAll()); }
}