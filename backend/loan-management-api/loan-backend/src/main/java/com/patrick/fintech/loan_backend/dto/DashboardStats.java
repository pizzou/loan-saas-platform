package com.patrick.fintech.loan_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalLoans;
    private long activeLoans;
    private long pendingLoans;
    private long rejectedLoans;
    private long closedLoans;
    private long totalBorrowers;
    private long overduePayments;
    private double totalAmountLent;
    private double paymentsCollected;
    private double penaltiesCollected;
}
