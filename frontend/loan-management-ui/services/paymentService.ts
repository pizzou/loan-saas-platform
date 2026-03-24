import { get, post } from './api';
import { Payment } from '../types/index';

// Fetch all payments for a loan
export const getPaymentsByLoan = (loanId: number): Promise<Payment[]> =>
  get(`/payments/loan/${loanId}`) as Promise<Payment[]>;

// Fetch all payments for the current org/user
export const getAllPayments = (): Promise<Payment[]> =>
  get('/payments') as Promise<Payment[]>;

// Fetch overdue payments for the current org/user
export const getOverduePayments = (): Promise<Payment[]> =>
  get('/payments/overdue') as Promise<Payment[]>;

// Record a payment
export const makePayment = async (
  paymentId: number,
  amount: number,
  method: string,
  txId?: string
): Promise<Payment> => {
  if (!amount || amount <= 0) throw new Error('Invalid payment amount');
  if (!method) throw new Error('Payment method is required');

  const payload = {
    amount,
    paymentMethod: method.toUpperCase(), // ensure matches backend enum
    ...(txId ? { transactionId: txId } : {}), // only send if defined
  };

  return post(`/payments/pay/${paymentId}`, payload) as Promise<Payment>;
};
