// Personal Budget Module — TypeScript Types

export type AccountType = 'cheque' | 'savings' | 'credit_card' | 'cash' | 'wallet' | 'investment' | 'other';
export type DebtType = 'personal_loan' | 'credit_card' | 'vehicle_finance' | 'home_loan' | 'store_account' | 'tax_debt' | 'medical_debt' | 'judgment' | 'family_loan' | 'other';
export type DebtStatus = 'active' | 'settled' | 'written_off' | 'disputed' | 'closed';
export type DebtPriority = 'critical' | 'high' | 'medium' | 'low';
export type CategoryType = 'income' | 'expense' | 'debt_payment' | 'transfer' | 'adjustment';
export type ItemType = 'income' | 'expense' | 'debt_payment' | 'savings' | 'transfer';
export type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annual';
export type ObligationStatus = 'unpaid' | 'paid' | 'partial' | 'skipped' | 'cancelled' | 'overdue';
export type TransactionType = 'income' | 'expense' | 'debt_payment' | 'transfer' | 'debt_charge' | 'adjustment';
export type AdjustmentDirection = 'increase' | 'decrease';
export type AuditAction = 'create' | 'edit' | 'soft_delete' | 'restore' | 'permanent_delete' | 'cascade_delete' | 'reassign';

export interface PersonalAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_type: AccountType;
  institution_name: string | null;
  account_number_last4: string | null;
  opening_balance: number;
  opening_balance_date: string;
  is_active: boolean;
  display_order: number;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalAccountBalance extends PersonalAccount {
  current_balance: number;
}

export interface PersonalDebt {
  id: string;
  user_id: string;
  debt_name: string;
  debt_type: DebtType;
  creditor_name: string | null;
  reference_number: string | null;
  opening_balance: number;
  opening_balance_date: string;
  interest_rate: number | null;
  normal_monthly_payment: number | null;
  payment_day: number | null;
  status: DebtStatus;
  priority: DebtPriority;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalDebtBalance extends PersonalDebt {
  current_balance: number;
}

export interface PersonalCategory {
  id: string;
  user_id: string;
  category_name: string;
  category_type: CategoryType;
  parent_category_id: string | null;
  is_active: boolean;
  display_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalRecurringItem {
  id: string;
  user_id: string;
  item_name: string;
  item_type: ItemType;
  default_amount: number;
  category_id: string | null;
  default_account_id: string | null;
  debt_id: string | null;
  frequency: Frequency;
  due_day: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  auto_generate: boolean;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalMonthlyObligation {
  id: string;
  user_id: string;
  recurring_item_id: string | null;
  obligation_month: string;
  obligation_name: string;
  obligation_type: ItemType;
  expected_amount: number;
  paid_amount: number;
  due_date: string | null;
  status: ObligationStatus;
  account_id: string | null;
  debt_id: string | null;
  category_id: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalTransaction {
  id: string;
  user_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  description: string;
  amount: number;
  account_id: string | null;
  transfer_to_account_id: string | null;
  debt_id: string | null;
  category_id: string | null;
  adjustment_direction: AdjustmentDirection | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  recurring_item_id: string | null;
  monthly_obligation_id: string | null;
  is_reconciled: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalAuditLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  action: AuditAction;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface MonthlySummary {
  user_id: string;
  obligation_month: string;
  total_expected: number;
  total_paid: number;
  total_unpaid: number;
  unpaid_count: number;
  paid_count: number;
}

// Form payloads
export interface MarkPaidPayload {
  paymentDate: string;
  amount: number;
  accountId: string;
  debtId?: string;
  categoryId?: string;
  reference?: string;
  notes?: string;
}

export interface TransactionFormData {
  transaction_date: string;
  transaction_type: TransactionType;
  description: string;
  amount: string;
  account_id: string;
  transfer_to_account_id: string;
  debt_id: string;
  category_id: string;
  adjustment_direction: AdjustmentDirection | '';
  payment_method: string;
  reference: string;
  notes: string;
  monthly_obligation_id?: string;
}
