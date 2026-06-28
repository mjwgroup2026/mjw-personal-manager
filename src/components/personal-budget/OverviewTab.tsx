import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { PersonalAccountBalance, PersonalDebtBalance, PersonalMonthlyObligation, PersonalTransaction } from '@/types/personal-budget';
import { fmt, fmtDate, StatusBadge } from './shared';
import { format, isAfter, addDays, parseISO } from 'date-fns';

interface Props {
  accounts: PersonalAccountBalance[];
  debts: PersonalDebtBalance[];
  obligations: PersonalMonthlyObligation[];
  transactions: PersonalTransaction[];
  month: Date;
}

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-lg font-bold font-body ${positive === true ? 'text-green-600' : positive === false ? 'text-red-500' : 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-muted-foreground font-body mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function OverviewTab({ accounts, debts, obligations, transactions, month }: Props) {
  const monthLabel = format(month, 'MMMM yyyy');

  const totalCash = useMemo(() => accounts.filter(a => a.is_active).reduce((s, a) => s + (a.current_balance ?? 0), 0), [accounts]);
  const totalDebt = useMemo(() => debts.filter(d => d.status === 'active').reduce((s, d) => s + Math.max(d.current_balance ?? 0, 0), 0), [debts]);
  const netPosition = totalCash - totalDebt;

  const monthIncome = useMemo(() =>
    transactions.filter(t => t.transaction_type === 'income' && !t.deleted_at).reduce((s, t) => s + t.amount, 0),
    [transactions]);
  const monthExpense = useMemo(() =>
    transactions.filter(t => t.transaction_type === 'expense' && !t.deleted_at).reduce((s, t) => s + t.amount, 0),
    [transactions]);
  const monthDebtPaid = useMemo(() =>
    transactions.filter(t => t.transaction_type === 'debt_payment' && !t.deleted_at).reduce((s, t) => s + t.amount, 0),
    [transactions]);

  const unpaidObligations = useMemo(() =>
    obligations.filter(o => ['unpaid', 'partial', 'overdue'].includes(o.status) && !o.deleted_at),
    [obligations]);
  const totalUnpaid = unpaidObligations.reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);
  const projectedCash = totalCash - totalUnpaid;

  const today = new Date();
  const overdue = obligations.filter(o => o.status === 'overdue' || (o.status === 'unpaid' && o.due_date && isAfter(today, parseISO(o.due_date))));
  const upcoming = obligations.filter(o =>
    ['unpaid', 'partial'].includes(o.status) &&
    o.due_date &&
    !isAfter(parseISO(o.due_date), addDays(today, 7)) &&
    !isAfter(today, parseISO(o.due_date)),
  );

  const recentTx = [...transactions].filter(t => !t.deleted_at).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard label="Total Cash" value={fmt(totalCash)} positive={totalCash > 0} />
        <SummaryCard label="Total Debt" value={fmt(totalDebt)} positive={totalDebt === 0} />
        <SummaryCard label="Net Position" value={fmt(netPosition)} positive={netPosition >= 0} sub={netPosition >= 0 ? 'surplus' : 'deficit'} />
        <SummaryCard label="Income This Month" value={fmt(monthIncome)} positive />
        <SummaryCard label="Spent This Month" value={fmt(monthExpense)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryCard label="Debt Paid" value={fmt(monthDebtPaid)} sub={monthLabel} />
        <SummaryCard label="Unpaid Responsibilities" value={fmt(totalUnpaid)} positive={totalUnpaid === 0} />
        <SummaryCard label="Projected After Unpaid" value={fmt(projectedCash)} positive={projectedCash >= 0} />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accounts */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Account Balances</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {accounts.length === 0 ? <p className="text-xs text-muted-foreground font-body">No accounts yet.</p> : (
              <div className="space-y-2">
                {accounts.filter(a => a.is_active).map(a => (
                  <div key={a.account_id} className="flex justify-between items-center text-xs font-body">
                    <span className="text-foreground">{a.account_name}</span>
                    <span className={`font-bold font-mono-num ${(a.current_balance ?? 0) < 0 ? 'text-red-500' : 'text-foreground'}`}>
                      {fmt(a.current_balance ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debts */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Open Debt</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {debts.filter(d => d.status === 'active').length === 0 ? <p className="text-xs text-muted-foreground font-body">No active debt.</p> : (
              <div className="space-y-2">
                {debts.filter(d => d.status === 'active').map(d => (
                  <div key={d.debt_id} className="flex justify-between items-center text-xs font-body">
                    <span className="text-foreground">{d.debt_name}</span>
                    <span className="font-bold font-mono-num text-red-500">{fmt(d.current_balance ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly checklist */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Monthly Checklist — {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {obligations.length === 0 ? <p className="text-xs text-muted-foreground font-body">No obligations generated.</p> : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {obligations.filter(o => !o.deleted_at).map(o => (
                  <div key={o.id} className="flex items-center gap-2 text-xs font-body">
                    {o.status === 'paid'
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      : <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className={`flex-1 truncate ${o.status === 'paid' ? 'line-through text-muted-foreground' : ''}`}>{o.obligation_name}</span>
                    <StatusBadge status={o.status} />
                    <span className="font-mono-num shrink-0">{fmt(o.expected_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-display">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTx.length === 0 ? <p className="text-xs text-muted-foreground font-body">No transactions this month.</p> : (
              <div className="space-y-1.5">
                {recentTx.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs font-body">
                    <div>
                      <p className="text-foreground truncate max-w-[180px]">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(t.transaction_date)}</p>
                    </div>
                    <span className={`font-bold font-mono-num ${t.transaction_type === 'income' ? 'text-green-600' : 'text-foreground'}`}>
                      {t.transaction_type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue & Upcoming */}
      {(overdue.length > 0 || upcoming.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {overdue.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" /> Overdue
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {overdue.map(o => (
                  <div key={o.id} className="flex justify-between text-xs font-body">
                    <span>{o.obligation_name}</span>
                    <span className="font-mono-num text-red-500">{fmt(o.expected_amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {upcoming.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" /> Due Within 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {upcoming.map(o => (
                  <div key={o.id} className="flex justify-between text-xs font-body">
                    <span>{o.obligation_name}</span>
                    <span className="font-mono-num">{fmt(o.expected_amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
