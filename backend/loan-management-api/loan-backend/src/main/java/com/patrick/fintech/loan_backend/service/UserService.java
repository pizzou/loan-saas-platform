package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {

    private final UserRepository         userRepository;
    private final RoleRepository         roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder        passwordEncoder;

    public UserService(UserRepository u, RoleRepository r,
                       OrganizationRepository o, PasswordEncoder p) {
        this.userRepository         = u;
        this.roleRepository         = r;
        this.organizationRepository = o;
        this.passwordEncoder        = p;
    }

    public User createUser(User user, Long roleId, Long orgId) {
        if (userRepository.existsByEmail(user.getEmail()))
            throw new RuntimeException("Email already exists: " + user.getEmail());
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
        Organization org = organizationRepository.findById(orgId)
            .orElseThrow(() -> new RuntimeException("Org not found: " + orgId));
        user.setRole(role);
        user.setOrganization(org);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<User> getAll()       { return userRepository.findAll(); }

    public User getById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User update(Long id, User updated) {
        User user = getById(id);
        if (updated.getName() != null && !updated.getName().isBlank())
            user.setName(updated.getName());
        return userRepository.save(user);
    }

    public User updatePassword(Long id, String newPassword) {
        User user = getById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public void delete(Long id) { userRepository.deleteById(id); }
}