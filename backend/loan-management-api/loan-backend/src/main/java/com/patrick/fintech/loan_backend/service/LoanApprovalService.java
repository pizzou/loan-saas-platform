package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LoanApprovalService {

    private final LoanApprovalRepository loanApprovalRepository;
    private final LoanRepository loanRepository;
    private final UserRepository userRepository;

    public LoanApprovalService(LoanApprovalRepository l, LoanRepository lr, UserRepository u) {
        this.loanApprovalRepository = l; this.loanRepository = lr; this.userRepository = u;
    }

    @Transactional
    public LoanApproval recordDecision(Long loanId, Long approverId, String decision, String comment) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        User approver = userRepository.findById(approverId).orElseThrow(() -> new RuntimeException("Approver not found"));
        LoanApproval approval = new LoanApproval();
        approval.setLoan(loan); approval.setApprover(approver);
        approval.setDecision(decision); approval.setComment(comment);
        approval.setDecisionDate(LocalDateTime.now());
        if ("APPROVED".equalsIgnoreCase(decision)) loan.setStatus(LoanStatus.APPROVED);
        else if ("REJECTED".equalsIgnoreCase(decision)) loan.setStatus(LoanStatus.REJECTED);
        loanRepository.save(loan);
        return loanApprovalRepository.save(approval);
    }

    public List<LoanApproval> getByLoan(Long loanId) { return loanApprovalRepository.findByLoan_Id(loanId); }
    public List<LoanApproval> getAll() { return loanApprovalRepository.findAll(); }
}