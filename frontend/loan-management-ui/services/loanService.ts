import { get, post } from './api';
import { Loan, RiskScore } from '../types/index';

export interface CreateLoanPayload {
  borrowerId:             number;
  amount:                 number;
  interestRate:           number;
  durationMonths:         number;
  currency:               string;
  startDate:              string;
  notes?:                 string;
  collateralValue?:       number;
  collateralDescription?: string;
}

export const getLoans           = (): Promise<Loan[]>         => get('/loans') as Promise<Loan[]>;
export const getLoanById        = (id: number): Promise<Loan> => get(`/loans/${id}`) as Promise<Loan>;
export const getLoansByBorrower = (id: number): Promise<Loan[]> => get(`/loans/borrower/${id}`) as Promise<Loan[]>;
export const createLoan         = (p: CreateLoanPayload): Promise<Loan> => post('/loans', p) as Promise<Loan>;
export const approveLoan        = (id: number): Promise<Loan> => post(`/loans/${id}/approve`) as Promise<Loan>;
export const rejectLoan         = (id: number, reason: string): Promise<Loan> =>
  post(`/loans/${id}/reject`, { reason }) as Promise<Loan>;
export const getLoanRiskScore   = (id: number): Promise<RiskScore> =>
  get(`/loans/${id}/risk`) as Promise<RiskScore>;