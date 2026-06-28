import { Badge } from '@/components/ui/badge';
import type { ObligationStatus, DebtStatus, DebtPriority, TransactionType } from '@/types/personal-budget';

export const fmt = (n: number) =>
  'R ' + Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export function StatusBadge({ status }: { status: ObligationStatus }) {
  const map: Record<ObligationStatus, string> = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    partial: 'bg-blue-100 text-blue-800 border-blue-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    skipped: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function DebtStatusBadge({ status }: { status: DebtStatus }) {
  const map: Record<DebtStatus, string> = {
    active: 'bg-red-100 text-red-800 border-red-200',
    settled: 'bg-green-100 text-green-800 border-green-200',
    written_off: 'bg-gray-100 text-gray-500 border-gray-200',
    disputed: 'bg-orange-100 text-orange-800 border-orange-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: DebtPriority }) {
  const map: Record<DebtPriority, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${map[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

export function TxTypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, string> = {
    income: 'bg-green-100 text-green-800 border-green-200',
    expense: 'bg-red-100 text-red-800 border-red-200',
    debt_payment: 'bg-orange-100 text-orange-800 border-orange-200',
    transfer: 'bg-blue-100 text-blue-800 border-blue-200',
    debt_charge: 'bg-purple-100 text-purple-800 border-purple-200',
    adjustment: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  const labels: Record<TransactionType, string> = {
    income: 'Income', expense: 'Expense', debt_payment: 'Debt Payment',
    transfer: 'Transfer', debt_charge: 'Debt Charge', adjustment: 'Adjustment',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${map[type]}`}>
      {labels[type]}
    </span>
  );
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cheque: 'Cheque', savings: 'Savings', credit_card: 'Credit Card',
  cash: 'Cash', wallet: 'Wallet', investment: 'Investment', other: 'Other',
};

export const DEBT_TYPE_LABELS: Record<string, string> = {
  personal_loan: 'Personal Loan', credit_card: 'Credit Card', vehicle_finance: 'Vehicle Finance',
  home_loan: 'Home Loan', store_account: 'Store Account', tax_debt: 'Tax Debt',
  medical_debt: 'Medical Debt', judgment: 'Judgment', family_loan: 'Family Loan', other: 'Other',
};
