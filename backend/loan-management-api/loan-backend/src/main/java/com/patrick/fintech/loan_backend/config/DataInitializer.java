package com.patrick.fintech.loan_backend.config;

import com.patrick.fintech.loan_backend.model.Organization;
import com.patrick.fintech.loan_backend.model.Role;
import com.patrick.fintech.loan_backend.model.RoleName;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.repository.OrganizationRepository;
import com.patrick.fintech.loan_backend.repository.RoleRepository;
import com.patrick.fintech.loan_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository         roleRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository         userRepository;
    private final PasswordEncoder        passwordEncoder;

    public DataInitializer(
            RoleRepository roleRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository         = roleRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository         = userRepository;
        this.passwordEncoder        = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // 1. Seed roles
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                System.out.println("[INIT] Created role: " + roleName);
            }
        }

        // 2. Seed default organization
        Organization org;
        if (organizationRepository.count() == 0) {
            org = new Organization();
            org.setName("LoanSaaS");
            org.setIndustry("Fintech");
            org = organizationRepository.save(org);
            System.out.println("[INIT] Created default organization id=" + org.getId());
        } else {
            org = organizationRepository.findAll().get(0);
        }

        // 3. Seed default admin user
        if (!userRepository.existsByEmail("admin@loansaas.com")) {
            Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@loansaas.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(adminRole);
            admin.setOrganization(org);
            userRepository.save(admin);
            System.out.println("[INIT] ========================================");
            System.out.println("[INIT] DEFAULT ADMIN USER CREATED");
            System.out.println("[INIT]   Email   : admin@loansaas.com");
            System.out.println("[INIT]   Password: admin123");
            System.out.println("[INIT]   Role    : ADMIN");
            System.out.println("[INIT]   Org     : " + org.getName());
            System.out.println("[INIT] CHANGE THIS PASSWORD AFTER FIRST LOGIN!");
            System.out.println("[INIT] ========================================");
        }

        // 4. Seed default loan officer user
        if (!userRepository.existsByEmail("officer@loansaas.com")) {
            Role officerRole = roleRepository.findByName(RoleName.LOAN_OFFICER)
                .orElseThrow(() -> new RuntimeException("LOAN_OFFICER role not found"));
            User officer = new User();
            officer.setName("Loan Officer");
            officer.setEmail("officer@loansaas.com");
            officer.setPassword(passwordEncoder.encode("officer123"));
            officer.setRole(officerRole);
            officer.setOrganization(org);
            userRepository.save(officer);
            System.out.println("[INIT] Created loan officer: officer@loansaas.com / officer123");
        }
    }
}