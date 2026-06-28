import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import type {
  PersonalAccountBalance, PersonalDebtBalance,
  PersonalTransaction, PersonalMonthlyObligation, PersonalCategory,
} from '@/types/personal-budget';
import { fmt } from './shared';

interface Props {
  accounts: PersonalAccountBalance[];
  debts: PersonalDebtBalance[];
  transactions: PersonalTransaction[];
  obligations: PersonalMonthlyObligation[];
  categories: PersonalCategory[];
  month: Date;
}

function Row({ label, value, bold, negative }: { label: string; value: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-border last:border-0 font-body text-xs ${bold ? 'font-bold' : ''}`}>
      <span className="text-foreground">{label}</span>
      <span className={`font-mono-num ${negative ? 'text-red-500' : ''}`}>{value}</span>
    </div>
  );
}

export default function ReportsTab({ accounts, debts, transactions, obligations, categories, month }: Props) {
  const monthLabel = format(month, 'MMMM yyyy');

  const activeTx = transactions.filter(t => !t.deleted_at);

  const income = useMemo(() => activeTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0), [activeTx]);
  const expense = useMemo(() => activeTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0), [activeTx]);
  const debtPaid = useMemo(() => activeTx.filter(t => t.transaction_type === 'debt_payment').reduce((s, t) => s + t.amount, 0), [activeTx]);
  const transfersOut = useMemo(() => activeTx.filter(t => t.transaction_type === 'transfer').reduce((s, t) => s + t.amount, 0), [activeTx]);
  const adjustments = useMemo(() => {
    const inc = activeTx.filter(t => t.transaction_type === 'adjustment' && t.adjustment_direction === 'increase').reduce((s, t) => s + t.amount, 0);
    const dec = activeTx.filter(t => t.transaction_type === 'adjustment' && t.adjustment_direction === 'decrease').reduce((s, t) => s + t.amount, 0);
    return inc - dec;
  }, [activeTx]);

  const totalCash = accounts.filter(a => a.is_active).reduce((s, a) => s + (a.current_balance ?? 0), 0);
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + Math.max(d.current_balance ?? 0, 0), 0);

  const totalExpected = obligations.filter(o => !['cancelled','skipped'].includes(o.status)).reduce((s, o) => s + o.expected_amount, 0);
  const totalOblPaid = obligations.filter(o => !['cancelled','skipped'].includes(o.status)).reduce((s, o) => s + o.paid_amount, 0);
  const totalUnpaid = obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status)).reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);
  const unpaidExpenses = obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status) && o.obligation_type === 'expense').reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);
  const unpaidDebt = obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status) && o.obligation_type === 'debt_payment').reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);
  const unpaidSavings = obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status) && o.obligation_type === 'savings').reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);
  const projectedCash = totalCash - totalUnpaid;

  // Category spend
  const catSpend = useMemo(() => {
    const map: Record<string, number> = {};
    activeTx.filter(t => t.transaction_type === 'expense' && t.category_id).forEach(t => {
      map[t.category_id!] = (map[t.category_id!] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, total]) => ({ cat: categories.find(c => c.id === id), total }))
      .filter(e => e.cat)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [activeTx, categories]);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">Reports — {monthLabel}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly cashflow */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Monthly Cashflow</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Row label="Income" value={`+${fmt(income)}`} />
            <Row label="Expenses" value={`-${fmt(expense)}`} negative={expense > 0} />
            <Row label="Debt Payments" value={`-${fmt(debtPaid)}`} negative={debtPaid > 0} />
            <Row label="Transfers Out" value={`-${fmt(transfersOut)}`} negative={transfersOut > 0} />
            <Row label="Adjustments Net" value={fmt(adjustments)} />
            <Row label="Net Cash Movement" value={fmt(income - expense - debtPaid - transfersOut + adjustments)} bold />
          </CardContent>
        </Card>

        {/* Projected month-end */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Projected Month-End Position</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Row label="Current Cash Available" value={fmt(totalCash)} />
            <Row label="Less Unpaid Expenses" value={`-${fmt(unpaidExpenses)}`} negative={unpaidExpenses > 0} />
            <Row label="Less Unpaid Debt Payments" value={`-${fmt(unpaidDebt)}`} negative={unpaidDebt > 0} />
            <Row label="Less Unpaid Savings" value={`-${fmt(unpaidSavings)}`} negative={unpaidSavings > 0} />
            <Row label="Projected Remaining Cash" value={fmt(projectedCash)} bold />
          </CardContent>
        </Card>

        {/* Monthly responsibilities */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Monthly Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Row label="Total Expected" value={fmt(totalExpected)} />
            <Row label="Paid" value={fmt(totalOblPaid)} />
            <Row label="Outstanding" value={fmt(totalUnpaid)} negative={totalUnpaid > 0} />
            <Row label="Paid count" value={String(obligations.filter(o => o.status === 'paid').length)} />
            <Row label="Unpaid count" value={String(obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status)).length)} />
            <Row label="Skipped" value={String(obligations.filter(o => o.status === 'skipped').length)} />
          </CardContent>
        </Card>

        {/* Debt reduction */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Debt Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Row label="Total Outstanding Debt" value={fmt(totalDebt)} negative={totalDebt > 0} bold />
            <Row label="Payments Made This Month" value={fmt(debtPaid)} />
            {debts.filter(d => d.status === 'active').map(d => (
              <Row key={d.debt_id} label={d.debt_name} value={fmt(d.current_balance ?? 0)} negative={(d.current_balance ?? 0) > 0} />
            ))}
          </CardContent>
        </Card>

        {/* Category spend */}
        {catSpend.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-display">Category Spend — Top 10</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {catSpend.map(({ cat, total }) => (
                <div key={cat!.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <span className="text-xs font-body flex-1">{cat!.category_name}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min((total / catSpend[0].total) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono-num font-bold shrink-0">{fmt(total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Account movement */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {accounts.filter(a => a.is_active).map(a => (
              <div key={a.account_id} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-xs font-body">
                <span>{a.account_name} <span className="text-muted-foreground text-[10px]">({a.account_type})</span></span>
                <span className={`font-mono-num font-bold ${(a.current_balance ?? 0) < 0 ? 'text-red-500' : ''}`}>{fmt(a.current_balance ?? 0)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 text-xs font-bold font-body">
              <span>Total Cash</span>
              <span className={`font-mono-num ${totalCash < 0 ? 'text-red-500' : 'text-green-600'}`}>{fmt(totalCash)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
