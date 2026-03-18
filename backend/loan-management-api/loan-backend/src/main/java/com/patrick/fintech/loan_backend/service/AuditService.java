package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Audit;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.repository.AuditRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditRepository auditRepository;

    public AuditService(AuditRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    public List<Audit> getByOrg(Long orgId) {
        return auditRepository.findByOrderByTimestampDesc().stream()
            .filter(a -> a.getUser() != null
                && a.getUser().getOrganization() != null
                && a.getUser().getOrganization().getId().equals(orgId))
            .toList();
    }

    public List<Audit> getAll() {
        return auditRepository.findByOrderByTimestampDesc();
    }

    public Audit logAction(Audit audit) {
        audit.setTimestamp(LocalDateTime.now());
        return auditRepository.save(audit);
    }

    public void log(String action, String entityName, Long entityId, User user) {
        try {
            Audit audit = new Audit();
            audit.setAction(action); audit.setEntityName(entityName);
            audit.setEntityId(entityId); audit.setUser(user);
            audit.setTimestamp(LocalDateTime.now());
            auditRepository.save(audit);
        } catch (Exception ignored) {}
    }
}