package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Audit;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.repository.AuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;

    public List<Audit> getAll() {
        return auditRepository.findByOrderByTimestampDesc();
    }

    public List<Audit> getByOrg(Long orgId) {
        return auditRepository.findByUser_Organization_IdOrderByTimestampDesc(orgId);
    }

    public void log(String action, String entityName, Long entityId, User user) {
        try {
            Audit audit = new Audit();
            audit.setAction(action);
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setUser(user);

            auditRepository.save(audit);

        } catch (Exception e) {
            log.error("Audit logging failed", e);
        }
    }
}
