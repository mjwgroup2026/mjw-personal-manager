import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type {
  PersonalTransaction, PersonalAccountBalance, PersonalDebtBalance, PersonalCategory,
  TransactionType, TransactionFormData, AdjustmentDirection,
} from '@/types/personal-budget';
import { fmt, fmtDate, TxTypeBadge } from './shared';
import { createTransaction, updateTransaction, softDeleteTransaction } from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

const TX_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'debt_payment', label: 'Debt Payment' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'debt_charge', label: 'Debt Charge' },
  { value: 'adjustment', label: 'Adjustment' },
];

interface Props {
  transactions: PersonalTransaction[];
  accounts: PersonalAccountBalance[];
  debts: PersonalDebtBalance[];
  categories: PersonalCategory[];
  userId: string;
  month: Date;
  onRefresh: () => void;
}

const blank = (): TransactionFormData => ({
  transaction_date: format(new Date(), 'yyyy-MM-dd'),
  transaction_type: 'expense',
  description: '', amount: '',
  account_id: '', transfer_to_account_id: '', debt_id: '',
  category_id: '', adjustment_direction: '', payment_method: '', reference: '', notes: '',
});

export default function TransactionsTab({ transactions, accounts, debts, categories, userId, month, onRefresh }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<TransactionFormData>(blank());
  const [editTarget, setEditTarget] = useState<PersonalTransaction | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonalTransaction | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(blank()); setEditTarget(null); setOpen(true); };
  const openEdit = (t: PersonalTransaction) => {
    setForm({
      transaction_date: t.transaction_date,
      transaction_type: t.transaction_type,
      description: t.description,
      amount: String(t.amount),
      account_id: t.account_id ?? '',
      transfer_to_account_id: t.transfer_to_account_id ?? '',
      debt_id: t.debt_id ?? '',
      category_id: t.category_id ?? '',
      adjustment_direction: t.adjustment_direction ?? '',
      payment_method: t.payment_method ?? '',
      reference: t.reference ?? '',
      notes: t.notes ?? '',
    });
    setEditTarget(t);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!form.description.trim()) return 'Description is required';
    if (!form.amount || parseFloat(form.amount) <= 0) return 'Amount must be greater than 0';
    if (['income', 'expense', 'debt_payment', 'transfer'].includes(form.transaction_type) && !form.account_id) return 'Account is required';
    if (form.transaction_type === 'debt_payment' && !form.debt_id) return 'Debt is required for debt payments';
    if (form.transaction_type === 'transfer' && !form.transfer_to_account_id) return 'Destination account is required for transfers';
    if (form.transaction_type === 'debt_charge' && !form.debt_id) return 'Debt is required for debt charges';
    if (form.transaction_type === 'adjustment' && !form.adjustment_direction) return 'Adjustment direction is required';
    if (form.transaction_type === 'adjustment' && !form.account_id && !form.debt_id) return 'Account or debt required for adjustment';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return toast({ title: err, variant: 'destructive' });
    setSaving(true);
    try {
      const payload: Partial<PersonalTransaction> = {
        transaction_date: form.transaction_date,
        transaction_type: form.transaction_type,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        account_id: form.account_id || null,
        transfer_to_account_id: form.transfer_to_account_id || null,
        debt_id: form.debt_id || null,
        category_id: form.category_id || null,
        adjustment_direction: (form.adjustment_direction as AdjustmentDirection) || null,
        payment_method: form.payment_method || null,
        reference: form.reference || null,
        notes: form.notes || null,
      };
      if (editTarget) {
        await updateTransaction(userId, editTarget.id, payload, editTarget);
      } else {
        await createTransaction(userId, payload);
      }
      setOpen(false);
      onRefresh();
      toast({ title: editTarget ? 'Transaction updated' : 'Transaction logged' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteTransaction(userId, deleteTarget.id, deleteTarget);
      setDeleteTarget(null);
      onRefresh();
      toast({ title: 'Transaction deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const f = form;
  const needsAccount = ['income', 'expense', 'debt_payment', 'transfer', 'adjustment'].includes(f.transaction_type);
  const needsDebt = ['debt_payment', 'debt_charge'].includes(f.transaction_type);
  const needsTransferTo = f.transaction_type === 'transfer';
  const needsAdjDir = f.transaction_type === 'adjustment';

  const accountById = (id: string) => accounts.find(a => a.account_id === id);
  const debtById = (id: string) => debts.find(d => d.debt_id === id);
  const catById = (id: string) => categories.find(c => c.id === id);

  const txSignColor = (t: PersonalTransaction) => {
    if (t.transaction_type === 'income') return 'text-green-600';
    if (t.transaction_type === 'debt_charge') return 'text-orange-500';
    return 'text-foreground';
  };

  const txSign = (t: PersonalTransaction) => {
    if (t.transaction_type === 'income') return '+';
    if (t.transaction_type === 'transfer') return '⇄';
    return '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">
          Transactions — {format(month, 'MMMM yyyy')}
        </h2>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground font-body text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Transaction
        </Button>
      </div>

      {transactions.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground font-body">No transactions this month.</CardContent></Card>
      )}

      <div className="space-y-1.5">
        {transactions.map(t => (
          <Card key={t.id}>
            <CardContent className="py-2.5 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-body font-medium text-foreground truncate">{t.description}</p>
                  <TxTypeBadge type={t.transaction_type} />
                </div>
                <p className="text-[10px] text-muted-foreground font-body">
                  {fmtDate(t.transaction_date)}
                  {t.account_id && accountById(t.account_id) ? ` · ${accountById(t.account_id)!.account_name}` : ''}
                  {t.debt_id && debtById(t.debt_id) ? ` · ${debtById(t.debt_id)!.debt_name}` : ''}
                  {t.category_id && catById(t.category_id) ? ` · ${catById(t.category_id)!.category_name}` : ''}
                </p>
              </div>
              <span className={`text-sm font-bold font-mono-num shrink-0 ${txSignColor(t)}`}>
                {txSign(t)}{fmt(t.amount)}
              </span>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editTarget ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs mb-1 block">Type *</Label>
                <Select value={f.transaction_type} onValueChange={v => setForm(p => ({ ...p, transaction_type: v as TransactionType }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TX_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="font-body">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Date *</Label>
                <Input type="date" value={f.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))} className="font-body" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Description *</Label>
                <Input value={f.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="font-body" placeholder="e.g. Pick n Pay groceries" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Amount (R) *</Label>
                <Input type="number" step="0.01" value={f.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="font-body" placeholder="0.00" />
              </div>
              {needsAdjDir && (
                <div>
                  <Label className="font-body text-xs mb-1 block">Direction *</Label>
                  <Select value={f.adjustment_direction} onValueChange={v => setForm(p => ({ ...p, adjustment_direction: v as AdjustmentDirection }))}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase" className="font-body">Increase</SelectItem>
                      <SelectItem value="decrease" className="font-body">Decrease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsAccount && (
                <div>
                  <Label className="font-body text-xs mb-1 block">{f.transaction_type === 'transfer' ? 'From Account' : 'Account'} *</Label>
                  <Select value={f.account_id} onValueChange={v => setForm(p => ({ ...p, account_id: v }))}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.account_id} value={a.account_id} className="font-body">{a.account_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsTransferTo && (
                <div>
                  <Label className="font-body text-xs mb-1 block">To Account *</Label>
                  <Select value={f.transfer_to_account_id} onValueChange={v => setForm(p => ({ ...p, transfer_to_account_id: v }))}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.account_id !== f.account_id).map(a => <SelectItem key={a.account_id} value={a.account_id} className="font-body">{a.account_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {needsDebt && (
                <div>
                  <Label className="font-body text-xs mb-1 block">Debt *</Label>
                  <Select value={f.debt_id} onValueChange={v => setForm(p => ({ ...p, debt_id: v }))}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select debt" /></SelectTrigger>
                    <SelectContent>
                      {debts.map(d => <SelectItem key={d.debt_id} value={d.debt_id} className="font-body">{d.debt_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="font-body text-xs mb-1 block">Category</Label>
                <Select value={f.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">None</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="font-body">{c.category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Reference</Label>
                <Input value={f.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} className="font-body" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Notes</Label>
                <Input value={f.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="font-body" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Log Transaction'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong>{deleteTarget?.description}</strong> ({deleteTarget ? fmt(deleteTarget.amount) : ''}) will be removed from all balance calculations. This action can be undone from the Audit tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={doDelete} className="font-body">Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
