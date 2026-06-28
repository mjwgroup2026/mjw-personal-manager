import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import type { PersonalAccountBalance } from '@/types/personal-budget';
import { fmt, fmtDate, ACCOUNT_TYPE_LABELS } from './shared';
import {
  createAccount, updateAccount, softDeleteAccount,
} from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as (keyof typeof ACCOUNT_TYPE_LABELS)[];

interface Props {
  accounts: PersonalAccountBalance[];
  userId: string;
  onRefresh: () => void;
}

const blank = () => ({
  account_name: '', account_type: 'cheque', institution_name: '',
  account_number_last4: '', opening_balance: '0',
  opening_balance_date: new Date().toISOString().split('T')[0],
  is_active: true, display_order: 0, notes: '',
});

export default function AccountsTab({ accounts, userId, onRefresh }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonalAccountBalance | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setForm(blank()); setEditId(null); setOpen(true); };
  const openEdit = (a: PersonalAccountBalance) => {
    setForm({
      account_name: a.account_name,
      account_type: a.account_type,
      institution_name: a.institution_name ?? '',
      account_number_last4: a.account_number_last4 ?? '',
      opening_balance: String(a.opening_balance),
      opening_balance_date: a.opening_balance_date,
      is_active: a.is_active,
      display_order: a.display_order,
      notes: a.notes ?? '',
    });
    setEditId(a.account_id);
    setOpen(true);
  };

  const save = async () => {
    if (!form.account_name.trim()) return toast({ title: 'Account name is required', variant: 'destructive' });
    setSaving(true);
    try {
      const payload = {
        account_name: form.account_name.trim(),
        account_type: form.account_type as PersonalAccountBalance['account_type'],
        institution_name: form.institution_name || null,
        account_number_last4: form.account_number_last4 || null,
        opening_balance: parseFloat(form.opening_balance) || 0,
        opening_balance_date: form.opening_balance_date,
        is_active: form.is_active,
        display_order: form.display_order,
        notes: form.notes || null,
      };
      if (editId) {
        const old = accounts.find(a => a.account_id === editId);
        await updateAccount(userId, editId, payload, old ?? {});
      } else {
        await createAccount(userId, payload);
      }
      setOpen(false);
      onRefresh();
      toast({ title: editId ? 'Account updated' : 'Account created' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteAccount(userId, deleteTarget.account_id, deleteTarget);
      setDeleteTarget(null);
      onRefresh();
      toast({ title: 'Account deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">Accounts</h2>
        <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground font-body text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground font-body">No accounts yet. Add one to start tracking cash.</CardContent></Card>
      )}

      <div className="space-y-2">
        {accounts.map(a => (
          <Card key={a.account_id} className={a.is_active ? '' : 'opacity-60'}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold font-body text-foreground">{a.account_name}</p>
                  <span className="text-[10px] font-body text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {ACCOUNT_TYPE_LABELS[a.account_type] ?? a.account_type}
                  </span>
                  {!a.is_active && <span className="text-[10px] text-muted-foreground">(inactive)</span>}
                </div>
                {a.institution_name && <p className="text-xs text-muted-foreground font-body">{a.institution_name}</p>}
                <p className="text-[10px] text-muted-foreground font-body">Opening: {fmt(a.opening_balance)} on {fmtDate(a.opening_balance_date)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-base font-bold font-mono-num ${(a.current_balance ?? 0) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {fmt(a.current_balance ?? 0)}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">current balance</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Totals */}
      {accounts.length > 0 && (
        <div className="flex justify-between items-center border-t pt-3 px-1">
          <p className="text-xs font-body text-muted-foreground">Total cash (active accounts)</p>
          <p className="text-sm font-bold font-mono-num">{fmt(accounts.filter(a => a.is_active).reduce((s, a) => s + (a.current_balance ?? 0), 0))}</p>
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Account Name *</Label>
                <Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} className="font-body" placeholder="e.g. ABSA Cheque" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Type *</Label>
                <Select value={form.account_type} onValueChange={v => setForm(f => ({ ...f, account_type: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t} className="font-body">{ACCOUNT_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Institution</Label>
                <Input value={form.institution_name} onChange={e => setForm(f => ({ ...f, institution_name: e.target.value }))} className="font-body" placeholder="e.g. ABSA" />
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
                <Label className="font-body text-xs mb-1 block">Acc. No. (last 4)</Label>
                <Input value={form.account_number_last4} onChange={e => setForm(f => ({ ...f, account_number_last4: e.target.value }))} className="font-body" maxLength={4} placeholder="1234" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Display Order</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} className="font-body" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-body" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <Label htmlFor="is_active" className="font-body text-xs">Active</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Account'}
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
            <AlertDialogTitle className="font-display">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong>{deleteTarget?.account_name}</strong> will be soft-deleted and hidden from balances. You can restore it from the Audit tab.
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
