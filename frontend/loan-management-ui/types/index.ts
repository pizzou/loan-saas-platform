export type LoanStatus    = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'PAID';
export type KycStatus     = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type RoleName      = 'ADMIN' | 'MANAGER' | 'LOAN_OFFICER' | 'ACCOUNTANT';
export type RiskCategory  = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OfflineActionType = 'CREATE_LOAN' | 'CREATE_BORROWER' | 'RECORD_PAYMENT' | 'UPDATE_BORROWER';

export interface Organization { id: number; name: string; industry?: string; }
export interface Role { id: number; name: RoleName; }
export interface User { id: number; name: string; email: string; role: Role; organization: Organization; }

export interface Borrower {
  id: number; firstName: string; lastName: string;
  email?: string; phone?: string; nationalId?: string;
  address?: string; creditScore?: number; kycStatus: KycStatus;
}

export interface BorrowerFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize?: number;
  borrower?: { id: number };
}

export interface Loan {
  id: number; amount: number; interestRate: number; durationMonths: number;
  currency: string; startDate: string; status: LoanStatus;
  notes?: string; rejectionReason?: string;
  riskScore?: number; riskCategory?: RiskCategory;
  collateralValue?: number;
  collateralDescription?: string;
  borrower: Borrower;
  approvedBy?: { id: number; name: string };
  approvedAt?: string;
}

export interface Payment {
  id: number; amount: number; penalty: number;
  dueDate: string; paidDate?: string; paid: boolean;
  paymentMethod?: string; transactionId?: string;
  installmentNumber?: number;
  loan?: { id: number };
}

export interface DashboardStats {
  totalLoans: number; activeLoans: number; pendingLoans: number;
  rejectedLoans: number; closedLoans: number; totalBorrowers: number;
  overduePayments: number; totalAmountLent: number;
  paymentsCollected: number; penaltiesCollected: number;
}

export interface AuthResponse {
  token: string; userId: number; name: string; email: string;
  role: RoleName; organizationId: number; organizationName: string;
}

export interface RiskScore {
  score: number; category: RiskCategory; recommendation: string;
  repaymentFactor: number; creditFactor: number;
  ltvFactor: number; kycFactor: number;
}

export interface ChartPoint { month: string; count?: number; amount: number; }

export interface OfflineAction {
  id: string; type: OfflineActionType; payload: unknown;
  timestamp: number; synced: boolean; retries: number;
}