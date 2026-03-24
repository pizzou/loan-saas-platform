package com.patrick.fintech.loan_backend.repository;

import com.patrick.fintech.loan_backend.model.Audit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditRepository extends JpaRepository<Audit, Long> {

    List<Audit> findByOrderByTimestampDesc();

    List<Audit> findByUser_Organization_IdOrderByTimestampDesc(Long orgId);
}
