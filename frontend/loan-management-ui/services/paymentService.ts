import { get, post } from './api';
import { Payment } from '../types/index';

/**
 * Fetch all payments for the current organization
 */
export const getAllPayments = (): Promise<Payment[]> =>
  get('/payments') as Promise<Payment[]>;

/**
 * Fetch payments that are overdue
 */
export const getOverduePayments = (): Promise<Payment[]> =>
  get('/payments/overdue') as Promise<Payment[]>;

/**
 * Fetch payments by loan ID
 */
export const getPaymentsByLoan = (id: number): Promise<Payment[]> =>
  get(`/payments/loan/${id}`) as Promise<Payment[]>;

/**
 * Make a payment
 * @param id Payment ID
 * @param amount Amount to pay
 * @param paymentMethod Method string (MOBILE_MONEY, BANK_TRANSFER, etc.)
 * @param transactionId Optional transaction ID
 */
export const makePayment = (
  id: number,
  amount: number,
  paymentMethod: string,
  transactionId?: string
): Promise<Payment> =>
  post(`/payments/pay/${id}`, {
    amount,
    paymentMethod,
    transactionId: transactionId ?? null,
  }) as Promise<Payment>;
