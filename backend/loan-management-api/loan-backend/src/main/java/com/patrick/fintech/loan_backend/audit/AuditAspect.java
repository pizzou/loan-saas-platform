package com.patrick.fintech.loan_backend.audit;

import com.patrick.fintech.loan_backend.model.Audit;
import com.patrick.fintech.loan_backend.model.User;
import com.patrick.fintech.loan_backend.service.AuditService;
import com.patrick.fintech.loan_backend.util.CurrentUserUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;
    private final CurrentUserUtil currentUserUtil;
    private final HttpServletRequest request;

    @AfterReturning(pointcut = "@annotation(auditable)", returning = "result")
    public void logAction(JoinPoint joinPoint, Auditable auditable, Object result) {
        try {
            User currentUser = currentUserUtil.getCurrentUser();

            Long entityId = null;

            // Attempt to extract the ID of the saved/returned entity
            if (result != null) {
                try {
                    entityId = (Long) result.getClass().getMethod("getId").invoke(result);
                } catch (Exception ignored) {}
            }

            Audit audit = new Audit();
            audit.setAction(auditable.action());
            audit.setEntityName(auditable.entity());
            audit.setEntityId(entityId);
            audit.setUser(currentUser);
            audit.setIpAddress(request.getRemoteAddr());
            audit.setUserAgent(request.getHeader("User-Agent"));

            auditService.logAction(audit);

        } catch (Exception e) {
            log.error("Failed to log audit action", e);
        }
    }
}
