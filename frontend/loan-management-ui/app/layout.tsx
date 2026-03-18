import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '../components/ui/ToastContainer';
import { OfflineBanner } from '../components/ui/OfflineBanner';

export const metadata: Metadata = {
  title: 'LoanSaaS',
  description: 'Fintech Loan Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OfflineBanner />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
