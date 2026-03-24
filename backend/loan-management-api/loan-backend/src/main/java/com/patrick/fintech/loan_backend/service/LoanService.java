package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.audit.Auditable;
import com.patrick.fintech.loan_backend.dto.LoanRequest;
import com.patrick.fintech.loan_backend.dto.RiskScoreResponse;
import com.patrick.fintech.loan_backend.model.*;
import com.patrick.fintech.loan_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class LoanService {

    private final LoanRepository         loanRepository;
    private final OrganizationRepository organizationRepository;
    private final PaymentRepository      paymentRepository;
    private final BorrowerRepository     borrowerRepository;
    private final RiskScoringService     riskScoringService;
    private final NotificationService    notificationService;

    public LoanService(LoanRepository loanRepo, OrganizationRepository orgRepo,
                       PaymentRepository payRepo, BorrowerRepository borRepo,
                       RiskScoringService riskService, NotificationService notifService) {
        this.loanRepository         = loanRepo;
        this.organizationRepository = orgRepo;
        this.paymentRepository      = payRepo;
        this.borrowerRepository     = borRepo;
        this.riskScoringService     = riskService;
        this.notificationService    = notifService;
    }

    @Auditable(action = "CREATE", entity = "Loan")
    @Transactional
    public Loan createLoan(LoanRequest req, Long organizationId) {
        Organization org = organizationRepository.findById(organizationId)
            .orElseThrow(() -> new RuntimeException("Organization not found: " + organizationId));
        Borrower borrower = borrowerRepository.findById(req.getBorrowerId())
            .orElseThrow(() -> new RuntimeException("Borrower not found: " + req.getBorrowerId()));

        Loan loan = new Loan();
        loan.setAmount(req.getAmount());
        loan.setInterestRate(req.getInterestRate());
        loan.setDurationMonths(req.getDurationMonths());
        loan.setCurrency(req.getCurrency());
        loan.setStartDate(LocalDate.parse(req.getStartDate()));
        loan.setNotes(req.getNotes());
        loan.setCollateralValue(req.getCollateralValue());
        loan.setCollateralDescription(req.getCollateralDescription());
        loan.setBorrower(borrower);
        loan.setOrganization(org);
        loan.setStatus(LoanStatus.PENDING);

        Loan saved = loanRepository.save(loan);

        try {
            RiskScoreResponse risk = riskScoringService.score(saved);
            saved.setRiskScore(risk.getScore());
            saved.setRiskCategory(risk.getCategory());
            loanRepository.save(saved);
        } catch (Exception ignored) {}

        return saved;
    }

    public List<Loan> getLoansByOrganization(Long orgId) {
        return loanRepository.findByOrganization_Id(orgId);
    }

    public List<Loan> getLoansByBorrower(Long borrowerId, Long orgId) {
        return loanRepository.findByBorrowerIdAndOrganizationId(borrowerId, orgId);
    }

    public Loan getLoanById(Long id) {
        return loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Loan not found: " + id));
    }

    public Loan getLoanByIdForOrg(Long id, Long orgId) {
        Loan loan = getLoanById(id);
        if (!loan.getOrganization().getId().equals(orgId))
            throw new RuntimeException("Loan not found: " + id);
        return loan;
    }

    @Auditable(action = "APPROVE", entity = "Loan")
    @Transactional
    public Loan approveLoan(Long loanId, User approvedBy) {
        Loan loan = getLoanById(loanId);
        if (loan.getStatus() == LoanStatus.APPROVED) throw new RuntimeException("Already approved");
        if (loan.getStatus() == LoanStatus.REJECTED)  throw new RuntimeException("Cannot approve rejected loan");

        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovedBy(approvedBy);
        loan.setApprovedAt(LocalDate.now());
        Loan saved = loanRepository.save(loan);

        generateRepaymentSchedule(saved);

        try { notificationService.sendLoanApproved(saved); } catch (Exception ignored) {}
        return saved;
    }

    @Auditable(action = "REJECT", entity = "Loan")
    @Transactional
    public Loan rejectLoan(Long loanId, String reason) {
        Loan loan = getLoanById(loanId);
        if (loan.getStatus() == LoanStatus.APPROVED) throw new RuntimeException("Cannot reject approved loan");

        loan.setStatus(LoanStatus.REJECTED);
        if (reason != null) loan.setRejectionReason(reason);
        Loan saved = loanRepository.save(loan);

        try { notificationService.sendLoanRejected(saved); } catch (Exception ignored) {}
        return saved;
    }

    private void generateRepaymentSchedule(Loan loan) {
        double principal    = loan.getAmount()         != null ? loan.getAmount()         : 0.0;
        double interestRate = loan.getInterestRate()   != null ? loan.getInterestRate()   : 0.0;
        int    duration     = loan.getDurationMonths() != null ? loan.getDurationMonths() : 1;
        double total        = principal + (principal * interestRate / 100.0);
        double installment  = total / duration;
        LocalDate dueDate   = (loan.getStartDate() != null
            ? loan.getStartDate() : LocalDate.now()).plusMonths(1);

        for (int i = 1; i <= duration; i++) {
            Payment p = new Payment();
            p.setLoan(loan); p.setOrganization(loan.getOrganization());
            p.setAmount(installment); p.setDueDate(dueDate);
            p.setPaid(false); p.setPenalty(0.0); p.setInstallmentNumber(i);
            paymentRepository.save(p);
            dueDate = dueDate.plusMonths(1);
        }
    }
}
