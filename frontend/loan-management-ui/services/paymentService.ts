import { get, post } from './api';
import { Payment } from '../types/index';

export const getPaymentsByLoan  = (id: number): Promise<Payment[]> =>
  get(`/payments/loan/${id}`) as Promise<Payment[]>;

export const getAllPayments      = (): Promise<Payment[]> =>
  get('/payments') as Promise<Payment[]>;

export const getOverduePayments = (): Promise<Payment[]> =>
  get('/payments/overdue') as Promise<Payment[]>;

export const makePayment = (
  id: number,
  amount: number,
  method: string,
  txId?: string
): Promise<Payment> =>
  post(`/payments/pay/${id}`, { amount, paymentMethod: method, transactionId: txId ?? null }) as Promise<Payment>;
