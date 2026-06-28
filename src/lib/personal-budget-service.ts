import { supabase } from '@/integrations/supabase/client';
import type {
  PersonalAccount, PersonalDebt, PersonalCategory, PersonalRecurringItem,
  PersonalMonthlyObligation, PersonalTransaction, PersonalAuditLog,
  PersonalAccountBalance, PersonalDebtBalance,
  MarkPaidPayload, AuditAction,
} from '@/types/personal-budget';
import { format, startOfMonth } from 'date-fns';

// ─── Audit ───────────────────────────────────────────────────────────────────

async function logAudit(
  userId: string,
  entityType: string,
  entityId: string | null,
  action: AuditAction,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null,
  reason?: string,
) {
  await supabase.from('personal_audit_log').insert({
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_values: oldValues ?? null,
    new_values: newValues ?? null,
    reason: reason ?? null,
  });
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function getAccounts(userId: string): Promise<PersonalAccountBalance[]> {
  const { data, error } = await supabase
    .from('personal_account_balances')
    .select('*')
    .eq('user_id', userId)
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as PersonalAccountBalance[];
}

export async function getAccountsRaw(userId: string): Promise<PersonalAccount[]> {
  const { data, error } = await supabase
    .from('personal_accounts')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as PersonalAccount[];
}

export async function createAccount(userId: string, values: Partial<PersonalAccount>) {
  const { data, error } = await supabase.from('personal_accounts').insert({ ...values, user_id: userId }).select().single();
  if (error) throw error;
  await logAudit(userId, 'account', data.id, 'create', null, data as Record<string, unknown>);
  return data;
}

export async function updateAccount(userId: string, id: string, values: Partial<PersonalAccount>, old: Partial<PersonalAccount>) {
  const { data, error } = await supabase.from('personal_accounts').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'account', id, 'edit', old as Record<string, unknown>, values as Record<string, unknown>);
  return data;
}

export async function softDeleteAccount(userId: string, id: string, old: PersonalAccount) {
  const { error } = await supabase.from('personal_accounts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'account', id, 'soft_delete', old as unknown as Record<string, unknown>);
}

export async function restoreAccount(userId: string, id: string) {
  const { error } = await supabase.from('personal_accounts').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'account', id, 'restore');
}

export async function permanentDeleteAccount(userId: string, id: string) {
  await logAudit(userId, 'account', id, 'permanent_delete');
  const { error } = await supabase.from('personal_accounts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Debts ───────────────────────────────────────────────────────────────────

export async function getDebts(userId: string): Promise<PersonalDebtBalance[]> {
  const { data, error } = await supabase
    .from('personal_debt_balances')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as PersonalDebtBalance[];
}

export async function getDebtsRaw(userId: string): Promise<PersonalDebt[]> {
  const { data, error } = await supabase
    .from('personal_debts')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('priority');
  if (error) throw error;
  return (data ?? []) as PersonalDebt[];
}

export async function createDebt(userId: string, values: Partial<PersonalDebt>) {
  const { data, error } = await supabase.from('personal_debts').insert({ ...values, user_id: userId }).select().single();
  if (error) throw error;
  await logAudit(userId, 'debt', data.id, 'create', null, data as Record<string, unknown>);
  return data;
}

export async function updateDebt(userId: string, id: string, values: Partial<PersonalDebt>, old: Partial<PersonalDebt>) {
  const { data, error } = await supabase.from('personal_debts').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'debt', id, 'edit', old as Record<string, unknown>, values as Record<string, unknown>);
  return data;
}

export async function softDeleteDebt(userId: string, id: string, old: PersonalDebt) {
  const { error } = await supabase.from('personal_debts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'debt', id, 'soft_delete', old as unknown as Record<string, unknown>);
}

export async function restoreDebt(userId: string, id: string) {
  const { error } = await supabase.from('personal_debts').update({ deleted_at: null }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'debt', id, 'restore');
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(userId: string): Promise<PersonalCategory[]> {
  const { data, error } = await supabase
    .from('personal_categories')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as PersonalCategory[];
}

export async function createCategory(userId: string, values: Partial<PersonalCategory>) {
  const { data, error } = await supabase.from('personal_categories').insert({ ...values, user_id: userId }).select().single();
  if (error) throw error;
  await logAudit(userId, 'category', data.id, 'create', null, data as Record<string, unknown>);
  return data;
}

export async function updateCategory(userId: string, id: string, values: Partial<PersonalCategory>) {
  const { data, error } = await supabase.from('personal_categories').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'category', id, 'edit', null, values as Record<string, unknown>);
  return data;
}

export async function softDeleteCategory(userId: string, id: string) {
  const { error } = await supabase.from('personal_categories').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'category', id, 'soft_delete');
}

export async function seedDefaultCategories(userId: string) {
  const existing = await getCategories(userId);
  if (existing.length > 0) return;
  const defaults = [
    { category_name: 'Salary', category_type: 'income' as const, display_order: 1 },
    { category_name: 'Extra Income', category_type: 'income' as const, display_order: 2 },
    { category_name: 'Rent / Bond', category_type: 'expense' as const, display_order: 3 },
    { category_name: 'Vehicle', category_type: 'expense' as const, display_order: 4 },
    { category_name: 'Insurance', category_type: 'expense' as const, display_order: 5 },
    { category_name: 'Medical', category_type: 'expense' as const, display_order: 6 },
    { category_name: 'Debt Payments', category_type: 'debt_payment' as const, display_order: 7 },
    { category_name: 'Subscriptions', category_type: 'expense' as const, display_order: 8 },
    { category_name: 'Utilities', category_type: 'expense' as const, display_order: 9 },
    { category_name: 'Food', category_type: 'expense' as const, display_order: 10 },
    { category_name: 'Fuel', category_type: 'expense' as const, display_order: 11 },
    { category_name: 'Pets', category_type: 'expense' as const, display_order: 12 },
    { category_name: 'Family', category_type: 'expense' as const, display_order: 13 },
    { category_name: 'Bank Fees', category_type: 'expense' as const, display_order: 14 },
    { category_name: 'Entertainment', category_type: 'expense' as const, display_order: 15 },
    { category_name: 'Savings', category_type: 'expense' as const, display_order: 16 },
    { category_name: 'Emergency', category_type: 'expense' as const, display_order: 17 },
    { category_name: 'Other', category_type: 'expense' as const, display_order: 18 },
  ];
  await supabase.from('personal_categories').insert(defaults.map(d => ({ ...d, user_id: userId })));
}

// ─── Recurring Items ──────────────────────────────────────────────────────────

export async function getRecurringItems(userId: string): Promise<PersonalRecurringItem[]> {
  const { data, error } = await supabase
    .from('personal_recurring_items')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('item_name');
  if (error) throw error;
  return (data ?? []) as PersonalRecurringItem[];
}

export async function createRecurringItem(userId: string, values: Partial<PersonalRecurringItem>) {
  const { data, error } = await supabase.from('personal_recurring_items').insert({ ...values, user_id: userId }).select().single();
  if (error) throw error;
  await logAudit(userId, 'recurring_item', data.id, 'create', null, data as Record<string, unknown>);
  return data;
}

export async function updateRecurringItem(userId: string, id: string, values: Partial<PersonalRecurringItem>, old: Partial<PersonalRecurringItem>) {
  const { data, error } = await supabase.from('personal_recurring_items').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'recurring_item', id, 'edit', old as Record<string, unknown>, values as Record<string, unknown>);
  return data;
}

export async function softDeleteRecurringItem(userId: string, id: string, old: PersonalRecurringItem) {
  const { error } = await supabase.from('personal_recurring_items').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'recurring_item', id, 'soft_delete', old as unknown as Record<string, unknown>);
}

// ─── Generate Monthly Obligations ─────────────────────────────────────────────

export async function generateMonthlyObligations(userId: string, month: Date): Promise<number> {
  const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');
  const items = await getRecurringItems(userId);
  const active = items.filter(i => i.is_active && i.auto_generate);

  // Load existing obligations for this month to avoid duplicates
  const { data: existing } = await supabase
    .from('personal_monthly_obligations')
    .select('recurring_item_id')
    .eq('user_id', userId)
    .eq('obligation_month', monthStr)
    .is('deleted_at', null);

  const existingIds = new Set((existing ?? []).map(e => e.recurring_item_id));

  const toCreate = active
    .filter(item => !existingIds.has(item.id))
    .map(item => ({
      user_id: userId,
      recurring_item_id: item.id,
      obligation_month: monthStr,
      obligation_name: item.item_name,
      obligation_type: item.item_type,
      expected_amount: item.default_amount,
      paid_amount: 0,
      due_date: item.due_day ? `${format(month, 'yyyy-MM')}-${String(item.due_day).padStart(2, '0')}` : null,
      status: 'unpaid' as const,
      account_id: item.default_account_id,
      debt_id: item.debt_id,
      category_id: item.category_id,
    }));

  if (toCreate.length > 0) {
    const { error } = await supabase.from('personal_monthly_obligations').insert(toCreate);
    if (error) throw error;
  }
  return toCreate.length;
}

// ─── Monthly Obligations ─────────────────────────────────────────────────────

export async function getMonthlyObligations(userId: string, month: Date): Promise<PersonalMonthlyObligation[]> {
  const monthStr = format(startOfMonth(month), 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('personal_monthly_obligations')
    .select('*')
    .eq('user_id', userId)
    .eq('obligation_month', monthStr)
    .is('deleted_at', null)
    .order('due_date');
  if (error) throw error;
  return (data ?? []) as PersonalMonthlyObligation[];
}

export async function updateObligation(userId: string, id: string, values: Partial<PersonalMonthlyObligation>, old: Partial<PersonalMonthlyObligation>) {
  const { data, error } = await supabase.from('personal_monthly_obligations').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'obligation', id, 'edit', old as Record<string, unknown>, values as Record<string, unknown>);
  return data as PersonalMonthlyObligation;
}

export async function markObligationPaid(userId: string, obligationId: string, payload: MarkPaidPayload) {
  // Load obligation
  const { data: obl, error: oblErr } = await supabase
    .from('personal_monthly_obligations')
    .select('*')
    .eq('id', obligationId)
    .single();
  if (oblErr) throw oblErr;
  const obligation = obl as PersonalMonthlyObligation;

  // Create transaction
  const txPayload: Partial<PersonalTransaction> = {
    user_id: userId,
    transaction_date: payload.paymentDate,
    transaction_type: obligation.obligation_type === 'debt_payment' ? 'debt_payment' : 'expense',
    description: `Payment: ${obligation.obligation_name}`,
    amount: payload.amount,
    account_id: payload.accountId,
    debt_id: payload.debtId ?? obligation.debt_id ?? null,
    category_id: payload.categoryId ?? obligation.category_id ?? null,
    reference: payload.reference ?? null,
    notes: payload.notes ?? null,
    monthly_obligation_id: obligationId,
  };

  const { data: tx, error: txErr } = await supabase.from('personal_transactions').insert(txPayload).select().single();
  if (txErr) throw txErr;

  await logAudit(userId, 'transaction', tx.id, 'create', null, txPayload as Record<string, unknown>);

  // Update obligation
  const newPaid = obligation.paid_amount + payload.amount;
  const newStatus = newPaid >= obligation.expected_amount ? 'paid' : 'partial';
  await updateObligation(userId, obligationId, { paid_amount: newPaid, status: newStatus }, { paid_amount: obligation.paid_amount, status: obligation.status });

  return tx;
}

export async function softDeleteObligation(userId: string, id: string, keepTransactions: boolean) {
  if (!keepTransactions) {
    // Soft delete linked transactions
    await supabase
      .from('personal_transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('monthly_obligation_id', id)
      .is('deleted_at', null);
  } else {
    // Unlink transactions
    await supabase
      .from('personal_transactions')
      .update({ monthly_obligation_id: null })
      .eq('monthly_obligation_id', id);
  }
  const { error } = await supabase.from('personal_monthly_obligations').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'obligation', id, 'soft_delete', null, null, keepTransactions ? 'kept_transactions' : 'deleted_transactions');
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(userId: string, month?: Date): Promise<PersonalTransaction[]> {
  let q = supabase
    .from('personal_transactions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false });

  if (month) {
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd');
    q = q.gte('transaction_date', start).lte('transaction_date', end);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PersonalTransaction[];
}

export async function createTransaction(userId: string, values: Partial<PersonalTransaction>) {
  const { data, error } = await supabase.from('personal_transactions').insert({ ...values, user_id: userId }).select().single();
  if (error) throw error;
  await logAudit(userId, 'transaction', data.id, 'create', null, data as Record<string, unknown>);
  return data as PersonalTransaction;
}

export async function updateTransaction(userId: string, id: string, values: Partial<PersonalTransaction>, old: Partial<PersonalTransaction>) {
  const { data, error } = await supabase.from('personal_transactions').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(userId, 'transaction', id, 'edit', old as Record<string, unknown>, values as Record<string, unknown>);

  // If linked to obligation, recalculate paid amount
  if (old.monthly_obligation_id) {
    await recalcObligationFromTransactions(userId, old.monthly_obligation_id);
  }

  return data as PersonalTransaction;
}

export async function softDeleteTransaction(userId: string, id: string, old: PersonalTransaction) {
  const { error } = await supabase.from('personal_transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
  await logAudit(userId, 'transaction', id, 'soft_delete', old as unknown as Record<string, unknown>);

  if (old.monthly_obligation_id) {
    await recalcObligationFromTransactions(userId, old.monthly_obligation_id);
  }
}

export async function permanentDeleteTransaction(userId: string, id: string, old: PersonalTransaction) {
  await logAudit(userId, 'transaction', id, 'permanent_delete', old as unknown as Record<string, unknown>);
  const { error } = await supabase.from('personal_transactions').delete().eq('id', id);
  if (error) throw error;

  if (old.monthly_obligation_id) {
    await recalcObligationFromTransactions(userId, old.monthly_obligation_id);
  }
}

async function recalcObligationFromTransactions(userId: string, obligationId: string) {
  const { data: obl } = await supabase.from('personal_monthly_obligations').select('expected_amount, paid_amount, status').eq('id', obligationId).single();
  if (!obl) return;

  const { data: txs } = await supabase
    .from('personal_transactions')
    .select('amount')
    .eq('monthly_obligation_id', obligationId)
    .is('deleted_at', null);

  const totalPaid = (txs ?? []).reduce((s, t) => s + t.amount, 0);
  let status: PersonalMonthlyObligation['status'] = 'unpaid';
  if (totalPaid >= obl.expected_amount) status = 'paid';
  else if (totalPaid > 0) status = 'partial';

  await supabase.from('personal_monthly_obligations').update({
    paid_amount: totalPaid,
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', obligationId);

  await logAudit(userId, 'obligation', obligationId, 'edit',
    { paid_amount: obl.paid_amount, status: obl.status },
    { paid_amount: totalPaid, status },
    'recalculated_from_transaction_change',
  );
}

// ─── Deleted Records ──────────────────────────────────────────────────────────

export async function getDeletedRecords(userId: string) {
  const [accounts, debts, transactions, obligations, recurring] = await Promise.all([
    supabase.from('personal_accounts').select('*').eq('user_id', userId).not('deleted_at', 'is', null),
    supabase.from('personal_debts').select('*').eq('user_id', userId).not('deleted_at', 'is', null),
    supabase.from('personal_transactions').select('*').eq('user_id', userId).not('deleted_at', 'is', null),
    supabase.from('personal_monthly_obligations').select('*').eq('user_id', userId).not('deleted_at', 'is', null),
    supabase.from('personal_recurring_items').select('*').eq('user_id', userId).not('deleted_at', 'is', null),
  ]);
  return {
    accounts: (accounts.data ?? []) as PersonalAccount[],
    debts: (debts.data ?? []) as PersonalDebt[],
    transactions: (transactions.data ?? []) as PersonalTransaction[],
    obligations: (obligations.data ?? []) as PersonalMonthlyObligation[],
    recurring: (recurring.data ?? []) as PersonalRecurringItem[],
  };
}

export async function getAuditLog(userId: string): Promise<PersonalAuditLog[]> {
  const { data, error } = await supabase
    .from('personal_audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as PersonalAuditLog[];
}
