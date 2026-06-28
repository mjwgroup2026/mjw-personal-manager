import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { PersonalDebtBalance, PersonalDebt, DebtType, DebtStatus, DebtPriority } from '@/types/personal-budget';
import { fmt, fmtDate, DEBT_TYPE_LABELS, DebtStatusBadge, PriorityBadge } from './shared';
import { createDebt, updateDebt, softDeleteDebt } from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

const DEBT_TYPES: DebtType[] = ['personal_loan','credit_card','vehicle_finance','home_loan','store_account','tax_debt','medical_debt','judgment','family_loan','other'];
const STATUSES: DebtStatus[] = ['active','settled','written_off','disputed','closed'];
const PRIORITIES: DebtPriority[] = ['critical','high','medium','low'];

interface Props {
  debts: PersonalDebtBalance[];
  userId: string;
  onRefresh: () => void;
}

const blank = () => ({
  debt_name: '', debt_type: 'personal_loan', creditor_name: '', reference_number: '',
  opening_balance: '0', opening_balance_date: new Date().toISOString().split('T')[0],
  interest_rate: '', normal_monthly_payment: '', payment_day: '',
  status: 'active', priority: 'medium', notes: '',
});

export default function DebtTab({ debts, userId, onRefresh }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonalDebtBalance | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(blank()); setEditId(null); setOpen(true); };
  const openEdit = (d: PersonalDebtBalance) => {
    setForm({
      debt_name: d.debt_name, debt_type: d.debt_type, creditor_name: d.creditor_name ?? '',
      reference_number: d.reference_number ?? '',
      opening_balance: String(d.opening_balance),
      opening_balance_date: d.opening_balance_date,
      interest_rate: d.interest_rate != null ? String(d.interest_rate) : '',
      normal_monthly_payment: d.normal_monthly_payment != null ? String(d.normal_monthly_payment) : '',
      payment_day: d.payment_day != null ? String(d.payment_day) : '',
      status: d.status, priority: d.priority, notes: d.notes ?? '',
    });
    setEditId(d.debt_id);
    setOpen(true);
  };

  const save = async () => {
    if (!form.debt_name.trim()) return toast({ title: 'Debt name is required', variant: 'destructive' });
    setSaving(true);
    try {
      const payload = {
        debt_name: form.debt_name.trim(),
        debt_type: form.debt_type as DebtType,
        creditor_name: form.creditor_name || null,
        reference_number: form.reference_number || null,
        opening_balance: parseFloat(form.opening_balance) || 0,
        opening_balance_date: form.opening_balance_date,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        normal_monthly_payment: form.normal_monthly_payment ? parseFloat(form.normal_monthly_payment) : null,
        payment_day: form.payment_day ? parseInt(form.payment_day) : null,
        status: form.status as DebtStatus,
        priority: form.priority as DebtPriority,
        notes: form.notes || null,
      };
      if (editId) {
        const old = debts.find(d => d.debt_id === editId);
        await updateDebt(userId, editId, payload, old ?? {});
      } else {
        await createDebt(userId, payload);
      }
      setOpen(false);
      onRefresh();
      toast({ title: editId ? 'Debt updated' : 'Debt added' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteDebt(userId, deleteTarget.debt_id, deleteTarget);
      setDeleteTarget(null);
      onRefresh();
      toast({ title: 'Debt deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + Math.max(d.current_balance ?? 0, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">Debt</h2>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground font-body text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Debt
        </Button>
      </div>

      {debts.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground font-body">No debt records. Add one to start tracking.</CardContent></Card>
      )}

      <div className="space-y-2">
        {debts.map(d => (
          <Card key={d.debt_id}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold font-body text-foreground">{d.debt_name}</p>
                  <DebtStatusBadge status={d.status} />
                  <PriorityBadge priority={d.priority} />
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  {DEBT_TYPE_LABELS[d.debt_type]} {d.creditor_name ? `· ${d.creditor_name}` : ''} {d.normal_monthly_payment ? `· ${fmt(d.normal_monthly_payment)}/mo` : ''}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">Opening: {fmt(d.opening_balance)} on {fmtDate(d.opening_balance_date)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-base font-bold font-mono-num ${(d.current_balance ?? 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {fmt(d.current_balance ?? 0)}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">outstanding</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(d)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {debts.length > 0 && (
        <div className="flex justify-between items-center border-t pt-3 px-1">
          <p className="text-xs font-body text-muted-foreground">Total active debt outstanding</p>
          <p className="text-sm font-bold font-mono-num text-red-500">{fmt(totalDebt)}</p>
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? 'Edit Debt' : 'New Debt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Debt Name *</Label>
                <Input value={form.debt_name} onChange={e => setForm(f => ({ ...f, debt_name: e.target.value }))} className="font-body" placeholder="e.g. ABSA Personal Loan" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Type *</Label>
                <Select value={form.debt_type} onValueChange={v => setForm(f => ({ ...f, debt_type: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map(t => <SelectItem key={t} value={t} className="font-body">{DEBT_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s} className="font-body">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p} className="font-body">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Creditor</Label>
                <Input value={form.creditor_name} onChange={e => setForm(f => ({ ...f, creditor_name: e.target.value }))} className="font-body" placeholder="e.g. ABSA Bank" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Opening Balance (R)</Label>
                <Input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Opening Balance Date</Label>
                <Input type="date" value={form.opening_balance_date} onChange={e => setForm(f => ({ ...f, opening_balance_date: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Monthly Payment (R)</Label>
                <Input type="number" step="0.01" value={form.normal_monthly_payment} onChange={e => setForm(f => ({ ...f, normal_monthly_payment: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Payment Day</Label>
                <Input type="number" min={1} max={31} value={form.payment_day} onChange={e => setForm(f => ({ ...f, payment_day: e.target.value }))} className="font-body" placeholder="1-31" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Interest Rate (%)</Label>
                <Input type="number" step="0.001" value={form.interest_rate} onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Reference No.</Label>
                <Input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} className="font-body" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-body" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Debt'}
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
            <AlertDialogTitle className="font-display">Delete Debt?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong>{deleteTarget?.debt_name}</strong> will be soft-deleted and removed from calculations. Restore from the Audit tab.
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
