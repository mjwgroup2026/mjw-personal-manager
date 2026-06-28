import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAccounts, getDebts, getCategories, getRecurringItems,
  getMonthlyObligations, getTransactions, seedDefaultCategories,
} from '@/lib/personal-budget-service';
import type {
  PersonalAccountBalance, PersonalDebtBalance, PersonalCategory,
  PersonalRecurringItem, PersonalMonthlyObligation, PersonalTransaction,
} from '@/types/personal-budget';
import OverviewTab from '@/components/personal-budget/OverviewTab';
import AccountsTab from '@/components/personal-budget/AccountsTab';
import DebtTab from '@/components/personal-budget/DebtTab';
import MonthlyTab from '@/components/personal-budget/MonthlyTab';
import TransactionsTab from '@/components/personal-budget/TransactionsTab';
import RecurringTab from '@/components/personal-budget/RecurringTab';
import ReportsTab from '@/components/personal-budget/ReportsTab';
import AuditTab from '@/components/personal-budget/AuditTab';

export default function PersonalBudget() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [tab, setTab] = useState('overview');

  // Data state
  const [accounts, setAccounts] = useState<PersonalAccountBalance[]>([]);
  const [debts, setDebts] = useState<PersonalDebtBalance[]>([]);
  const [categories, setCategories] = useState<PersonalCategory[]>([]);
  const [recurring, setRecurring] = useState<PersonalRecurringItem[]>([]);
  const [obligations, setObligations] = useState<PersonalMonthlyObligation[]>([]);
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const loadAll = useCallback(async () => {
    if (!userId) return;
    try {
      const [accs, dbs, cats, rec, obls, txs] = await Promise.all([
        getAccounts(userId),
        getDebts(userId),
        getCategories(userId),
        getRecurringItems(userId),
        getMonthlyObligations(userId, month),
        getTransactions(userId, month),
      ]);
      setAccounts(accs);
      setDebts(dbs);
      setCategories(cats);
      setRecurring(rec);
      setObligations(obls);
      setTransactions(txs);
    } catch (e) {
      console.error('PersonalBudget load error:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, month]);

  useEffect(() => {
    if (!userId) return;
    // Seed categories on first load, then load all data
    seedDefaultCategories(userId).then(() => loadAll());
  }, [userId, month]);

  const refresh = useCallback(() => loadAll(), [loadAll]);

  if (!userId) return null;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Wallet className="h-6 w-6 text-accent" /> Personal Budget
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Full personal finance control centre</p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMonth(m => startOfMonth(subMonths(m, 1)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-body font-medium min-w-[100px] text-center">{format(month, 'MMMM yyyy')}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMonth(m => startOfMonth(addMonths(m, 1)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground font-body">Loading…</p>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50">
            <TabsTrigger value="overview" className="font-body text-xs">Overview</TabsTrigger>
            <TabsTrigger value="accounts" className="font-body text-xs">
              Accounts {accounts.length > 0 && <span className="ml-1 text-[10px] bg-muted rounded px-1">{accounts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="debt" className="font-body text-xs">
              Debt {debts.filter(d => d.status === 'active').length > 0 && <span className="ml-1 text-[10px] bg-muted rounded px-1">{debts.filter(d => d.status === 'active').length}</span>}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="font-body text-xs">
              Monthly {obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status)).length > 0 && (
                <span className="ml-1 text-[10px] bg-red-500 text-white rounded px-1">
                  {obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status)).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="font-body text-xs">
              Transactions {transactions.length > 0 && <span className="ml-1 text-[10px] bg-muted rounded px-1">{transactions.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="recurring" className="font-body text-xs">
              Recurring {recurring.length > 0 && <span className="ml-1 text-[10px] bg-muted rounded px-1">{recurring.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="reports" className="font-body text-xs">Reports</TabsTrigger>
            <TabsTrigger value="audit" className="font-body text-xs">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              accounts={accounts}
              debts={debts}
              obligations={obligations}
              transactions={transactions}
              month={month}
            />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsTab
              accounts={accounts}
              userId={userId}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="debt">
            <DebtTab
              debts={debts}
              userId={userId}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyTab
              obligations={obligations}
              accounts={accounts}
              debts={debts}
              categories={categories}
              userId={userId}
              month={month}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab
              transactions={transactions}
              accounts={accounts}
              debts={debts}
              categories={categories}
              userId={userId}
              month={month}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringTab
              items={recurring}
              accounts={accounts}
              debts={debts}
              categories={categories}
              userId={userId}
              month={month}
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab
              accounts={accounts}
              debts={debts}
              transactions={transactions}
              obligations={obligations}
              categories={categories}
              month={month}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTab userId={userId} onRefresh={refresh} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
