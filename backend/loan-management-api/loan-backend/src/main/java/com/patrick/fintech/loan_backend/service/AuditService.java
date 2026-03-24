package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Audit;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.repository.AuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;

    /** Get all audit logs ordered by timestamp descending */
    public List<Audit> getAll() {
        return auditRepository.findByOrderByTimestampDesc();
    }

    /** Get audit logs for a specific organization */
    public List<Audit> getByOrg(Long orgId) {
        return auditRepository.findByUser_Organization_IdOrderByTimestampDesc(orgId);
    }

    /** Save an audit entry with timezone-aware timestamp */
    public Audit logAction(Audit audit) {
        try {
            // If user has a timezone, use it; otherwise fallback to server default
            ZoneId zone = (audit.getUser() != null && audit.getUser().getTimezone() != null)
                    ? ZoneId.of(audit.getUser().getTimezone())
                    : ZoneId.systemDefault();

            audit.setTimestamp(OffsetDateTime.now(zone));  // ✅ timezone-aware timestamp

            return auditRepository.save(audit);

        } catch (Exception e) {
            log.error("Audit logging failed in logAction", e);
            return null;
        }
    }

    /** Quick log method without needing to create Audit manually */
    public void log(String action, String entityName, Long entityId, User user) {
        try {
            Audit audit = new Audit();
            audit.setAction(action);
            audit.setEntityName(entityName);
            audit.setEntityId(entityId);
            audit.setUser(user);

            // Set timestamp using user timezone or server default
            ZoneId zone = (user != null && user.getTimezone() != null)
                    ? ZoneId.of(user.getTimezone())
                    : ZoneId.systemDefault();
            audit.setTimestamp(OffsetDateTime.now(zone));

            auditRepository.save(audit);

        } catch (Exception e) {
            log.error("Audit logging failed in log()", e);
        }
    }
}
