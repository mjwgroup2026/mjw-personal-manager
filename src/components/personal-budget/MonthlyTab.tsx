import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, CheckCircle, Clock, SkipForward, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type {
  PersonalMonthlyObligation, PersonalAccount, PersonalAccountBalance, PersonalDebtBalance, PersonalDebt,
  PersonalCategory, ObligationStatus, MarkPaidPayload,
} from '@/types/personal-budget';
import { fmt, StatusBadge } from './shared';
import { markObligationPaid, updateObligation, softDeleteObligation } from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

interface Props {
  obligations: PersonalMonthlyObligation[];
  accounts: PersonalAccountBalance[];
  debts: PersonalDebtBalance[];
  categories: PersonalCategory[];
  userId: string;
  month: Date;
  onRefresh: () => void;
}

interface MarkPaidForm {
  paymentDate: string;
  amount: string;
  accountId: string;
  debtId: string;
  categoryId: string;
  reference: string;
  notes: string;
}

const blankPaidForm = (obl: PersonalMonthlyObligation): MarkPaidForm => ({
  paymentDate: format(new Date(), 'yyyy-MM-dd'),
  amount: String(Math.max(obl.expected_amount - obl.paid_amount, 0)),
  accountId: obl.account_id ?? '',
  debtId: obl.debt_id ?? '',
  categoryId: obl.category_id ?? '',
  reference: '', notes: '',
});

export default function MonthlyTab({ obligations, accounts, debts, categories, userId, month, onRefresh }: Props) {
  const { toast } = useToast();
  const [markPaidTarget, setMarkPaidTarget] = useState<PersonalMonthlyObligation | null>(null);
  const [paidForm, setPaidForm] = useState<MarkPaidForm | null>(null);
  const [editTarget, setEditTarget] = useState<PersonalMonthlyObligation | null>(null);
  const [editForm, setEditForm] = useState<Partial<PersonalMonthlyObligation>>({});
  const [deleteTarget, setDeleteTarget] = useState<PersonalMonthlyObligation | null>(null);
  const [deleteMode, setDeleteMode] = useState<'keep' | 'delete'>('keep');
  const [saving, setSaving] = useState(false);

  const openMarkPaid = (obl: PersonalMonthlyObligation) => {
    setMarkPaidTarget(obl);
    setPaidForm(blankPaidForm(obl));
  };

  const doMarkPaid = async () => {
    if (!markPaidTarget || !paidForm) return;
    if (!paidForm.amount || parseFloat(paidForm.amount) <= 0) return toast({ title: 'Amount must be > 0', variant: 'destructive' });
    if (!paidForm.accountId && markPaidTarget.obligation_type !== 'debt_charge') return toast({ title: 'Account is required', variant: 'destructive' });
    if (markPaidTarget.obligation_type === 'debt_payment' && !paidForm.debtId) return toast({ title: 'Debt is required for debt payment', variant: 'destructive' });
    setSaving(true);
    try {
      const payload: MarkPaidPayload = {
        paymentDate: paidForm.paymentDate,
        amount: parseFloat(paidForm.amount),
        accountId: paidForm.accountId,
        debtId: paidForm.debtId || undefined,
        categoryId: paidForm.categoryId || undefined,
        reference: paidForm.reference || undefined,
        notes: paidForm.notes || undefined,
      };
      await markObligationPaid(userId, markPaidTarget.id, payload);
      setMarkPaidTarget(null);
      setPaidForm(null);
      onRefresh();
      toast({ title: 'Payment recorded' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (obl: PersonalMonthlyObligation) => {
    setEditTarget(obl);
    setEditForm({ ...obl });
  };

  const doEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateObligation(userId, editTarget.id, editForm, editTarget);
      setEditTarget(null);
      onRefresh();
      toast({ title: 'Obligation updated' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (obl: PersonalMonthlyObligation, status: ObligationStatus) => {
    try {
      await updateObligation(userId, obl.id, { status }, { status: obl.status });
      onRefresh();
      toast({ title: `Marked ${status}` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteObligation(userId, deleteTarget.id, deleteMode === 'keep');
      setDeleteTarget(null);
      onRefresh();
      toast({ title: 'Obligation deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const totalExpected = obligations.filter(o => !['cancelled','skipped'].includes(o.status)).reduce((s, o) => s + o.expected_amount, 0);
  const totalPaid = obligations.filter(o => !['cancelled','skipped'].includes(o.status)).reduce((s, o) => s + o.paid_amount, 0);
  const totalUnpaid = obligations.filter(o => ['unpaid','partial','overdue'].includes(o.status)).reduce((s, o) => s + Math.max(o.expected_amount - o.paid_amount, 0), 0);

  const accountById = (id: string) => accounts.find(a => a.account_id === id);
  const debtById = (id: string) => debts.find(d => d.debt_id === id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">
          Monthly Responsibilities — {format(month, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Totals bar */}
      {obligations.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase">Expected</p>
            <p className="text-base font-bold font-mono-num">{fmt(totalExpected)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase">Paid</p>
            <p className="text-base font-bold font-mono-num text-green-600">{fmt(totalPaid)}</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase">Unpaid</p>
            <p className="text-base font-bold font-mono-num text-red-500">{fmt(totalUnpaid)}</p>
          </CardContent></Card>
        </div>
      )}

      {obligations.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground font-body">
          No obligations for this month. Go to Recurring Items and click Generate.
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {obligations.map(obl => (
          <Card key={obl.id} className={obl.status === 'paid' ? 'bg-green-50 border-green-100' : obl.status === 'overdue' ? 'border-red-200' : ''}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold font-body text-foreground">{obl.obligation_name}</p>
                    <StatusBadge status={obl.status} />
                    <span className="text-[10px] font-body text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{obl.obligation_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
                    {obl.due_date && <span>Due: {obl.due_date}</span>}
                    {obl.account_id && accountById(obl.account_id) && <span>From: {accountById(obl.account_id)!.account_name}</span>}
                    {obl.debt_id && debtById(obl.debt_id) && <span>Debt: {debtById(obl.debt_id)!.debt_name}</span>}
                  </div>
                  {obl.paid_amount > 0 && obl.status !== 'paid' && (
                    <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((obl.paid_amount / obl.expected_amount) * 100, 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono-num">{fmt(obl.expected_amount)}</p>
                  {obl.paid_amount > 0 && <p className="text-[10px] text-green-600 font-body">{fmt(obl.paid_amount)} paid</p>}
                  {obl.paid_amount < obl.expected_amount && obl.paid_amount > 0 && (
                    <p className="text-[10px] text-orange-500 font-body">{fmt(obl.expected_amount - obl.paid_amount)} left</p>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {obl.status !== 'paid' && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] font-body px-2 text-green-700 border-green-300 hover:bg-green-50" onClick={() => openMarkPaid(obl)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                  </Button>
                )}
                {obl.status === 'partial' && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] font-body px-2" onClick={() => openMarkPaid(obl)}>
                    <Clock className="h-3 w-3 mr-1" /> Add Payment
                  </Button>
                )}
                {!['skipped','cancelled'].includes(obl.status) && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] font-body px-2" onClick={() => quickStatus(obl, 'skipped')}>
                    <SkipForward className="h-3 w-3 mr-1" /> Skip
                  </Button>
                )}
                {!['cancelled'].includes(obl.status) && (
                  <Button size="sm" variant="outline" className="h-6 text-[10px] font-body px-2 text-orange-600 border-orange-300" onClick={() => quickStatus(obl, 'cancelled')}>
                    <XCircle className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-6 text-[10px] font-body px-2" onClick={() => openEdit(obl)}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] font-body px-2 text-destructive" onClick={() => setDeleteTarget(obl)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mark Paid dialog */}
      <Dialog open={!!markPaidTarget} onOpenChange={() => { setMarkPaidTarget(null); setPaidForm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment — {markPaidTarget?.obligation_name}</DialogTitle>
          </DialogHeader>
          {paidForm && (
            <div className="space-y-3 pt-2">
              <div>
                <Label className="font-body text-xs mb-1 block">Payment Date</Label>
                <Input type="date" value={paidForm.paymentDate} onChange={e => setPaidForm(f => f ? { ...f, paymentDate: e.target.value } : f)} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Amount (R) *</Label>
                <Input type="number" step="0.01" value={paidForm.amount} onChange={e => setPaidForm(f => f ? { ...f, amount: e.target.value } : f)} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Pay From Account *</Label>
                <Select value={paidForm.accountId} onValueChange={v => setPaidForm(f => f ? { ...f, accountId: v } : f)}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.account_id} value={a.account_id} className="font-body">{a.account_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {markPaidTarget?.obligation_type === 'debt_payment' && (
                <div>
                  <Label className="font-body text-xs mb-1 block">Debt *</Label>
                  <Select value={paidForm.debtId} onValueChange={v => setPaidForm(f => f ? { ...f, debtId: v } : f)}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select debt" /></SelectTrigger>
                    <SelectContent>
                      {debts.map(d => <SelectItem key={d.debt_id} value={d.debt_id} className="font-body">{d.debt_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="font-body text-xs mb-1 block">Category</Label>
                <Select value={paidForm.categoryId} onValueChange={v => setPaidForm(f => f ? { ...f, categoryId: v } : f)}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">None</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="font-body">{c.category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Reference</Label>
                <Input value={paidForm.reference} onChange={e => setPaidForm(f => f ? { ...f, reference: e.target.value } : f)} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Notes</Label>
                <Input value={paidForm.notes} onChange={e => setPaidForm(f => f ? { ...f, notes: e.target.value } : f)} className="font-body" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={doMarkPaid} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                  {saving ? 'Saving…' : 'Record Payment'}
                </Button>
                <Button variant="outline" onClick={() => { setMarkPaidTarget(null); setPaidForm(null); }} className="font-body">Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Obligation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="font-body text-xs mb-1 block">Name</Label>
              <Input value={editForm.obligation_name ?? ''} onChange={e => setEditForm(f => ({ ...f, obligation_name: e.target.value }))} className="font-body" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs mb-1 block">Expected Amount (R)</Label>
                <Input type="number" step="0.01" value={editForm.expected_amount ?? ''} onChange={e => setEditForm(f => ({ ...f, expected_amount: parseFloat(e.target.value) || 0 }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Due Date</Label>
                <Input type="date" value={editForm.due_date ?? ''} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Status</Label>
                <Select value={editForm.status ?? 'unpaid'} onValueChange={v => setEditForm(f => ({ ...f, status: v as ObligationStatus }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['unpaid','paid','partial','skipped','cancelled','overdue'] as ObligationStatus[]).map(s => (
                      <SelectItem key={s} value={s} className="font-body capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Account</Label>
                <Select value={editForm.account_id ?? ''} onValueChange={v => setEditForm(f => ({ ...f, account_id: v || null }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">None</SelectItem>
                    {accounts.map(a => <SelectItem key={a.account_id} value={a.account_id} className="font-body">{a.account_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Notes</Label>
              <Input value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="font-body" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={doEdit} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditTarget(null)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Obligation?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm space-y-2">
              <p>What should happen to linked payment transactions?</p>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={deleteMode === 'keep'} onChange={() => setDeleteMode('keep')} />
                  <span className="text-xs">Keep transactions (unlink from obligation)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={deleteMode === 'delete'} onChange={() => setDeleteMode('delete')} />
                  <span className="text-xs">Delete obligation and all linked transactions</span>
                </label>
              </div>
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
