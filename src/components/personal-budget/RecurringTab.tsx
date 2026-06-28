import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { PersonalRecurringItem, PersonalAccountBalance, PersonalDebtBalance, PersonalCategory, ItemType, Frequency } from '@/types/personal-budget';
import { fmt } from './shared';
import { createRecurringItem, updateRecurringItem, softDeleteRecurringItem, generateMonthlyObligations } from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'debt_payment', label: 'Debt Payment' },
  { value: 'savings', label: 'Savings' },
  { value: 'transfer', label: 'Transfer' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

interface Props {
  items: PersonalRecurringItem[];
  accounts: PersonalAccountBalance[];
  debts: PersonalDebtBalance[];
  categories: PersonalCategory[];
  userId: string;
  month: Date;
  onRefresh: () => void;
}

const blank = () => ({
  item_name: '', item_type: 'expense', default_amount: '',
  category_id: '', default_account_id: '', debt_id: '',
  frequency: 'monthly', due_day: '', start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: '', is_active: true, auto_generate: true, notes: '',
});

export default function RecurringTab({ items, accounts, debts, categories, userId, month, onRefresh }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(blank());
  const [editTarget, setEditTarget] = useState<PersonalRecurringItem | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonalRecurringItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const openNew = () => { setForm(blank()); setEditTarget(null); setOpen(true); };
  const openEdit = (item: PersonalRecurringItem) => {
    setForm({
      item_name: item.item_name, item_type: item.item_type,
      default_amount: String(item.default_amount),
      category_id: item.category_id ?? '', default_account_id: item.default_account_id ?? '',
      debt_id: item.debt_id ?? '', frequency: item.frequency,
      due_day: item.due_day != null ? String(item.due_day) : '',
      start_date: item.start_date, end_date: item.end_date ?? '',
      is_active: item.is_active, auto_generate: item.auto_generate, notes: item.notes ?? '',
    });
    setEditTarget(item);
    setOpen(true);
  };

  const save = async () => {
    if (!form.item_name.trim()) return toast({ title: 'Item name is required', variant: 'destructive' });
    if (!form.default_amount || parseFloat(form.default_amount) <= 0) return toast({ title: 'Amount must be > 0', variant: 'destructive' });
    setSaving(true);
    try {
      const payload = {
        item_name: form.item_name.trim(),
        item_type: form.item_type as ItemType,
        default_amount: parseFloat(form.default_amount),
        category_id: form.category_id || null,
        default_account_id: form.default_account_id || null,
        debt_id: form.debt_id || null,
        frequency: form.frequency as Frequency,
        due_day: form.due_day ? parseInt(form.due_day) : null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        is_active: form.is_active,
        auto_generate: form.auto_generate,
        notes: form.notes || null,
      };
      if (editTarget) {
        await updateRecurringItem(userId, editTarget.id, payload, editTarget);
      } else {
        await createRecurringItem(userId, payload);
      }
      setOpen(false);
      onRefresh();
      toast({ title: editTarget ? 'Item updated' : 'Recurring item created' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteRecurringItem(userId, deleteTarget.id, deleteTarget);
      setDeleteTarget(null);
      onRefresh();
      toast({ title: 'Recurring item deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const count = await generateMonthlyObligations(userId, month);
      onRefresh();
      toast({ title: count > 0 ? `${count} obligation(s) generated for ${format(month, 'MMMM yyyy')}` : `All obligations already exist for ${format(month, 'MMMM yyyy')}` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const accountById = (id: string) => accounts.find(a => a.account_id === id);
  const debtById = (id: string) => debts.find(d => d.debt_id === id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">Recurring Items</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generate} disabled={generating} className="font-body text-xs">
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generating ? 'animate-spin' : ''}`} />
            Generate {format(month, 'MMM')} Obligations
          </Button>
          <Button size="sm" onClick={openNew} className="bg-primary text-primary-foreground font-body text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Recurring
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <Card><CardContent className="py-8 text-center text-xs text-muted-foreground font-body">No recurring items yet. Add subscriptions, salaries, or debt payments here.</CardContent></Card>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <Card key={item.id} className={item.is_active ? '' : 'opacity-60'}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold font-body text-foreground">{item.item_name}</p>
                  <span className="text-[10px] font-body text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{item.item_type.replace('_', ' ')}</span>
                  <span className="text-[10px] font-body text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{item.frequency}</span>
                  {!item.is_active && <span className="text-[10px] text-muted-foreground">(inactive)</span>}
                </div>
                <p className="text-[10px] text-muted-foreground font-body">
                  {item.due_day ? `Due day ${item.due_day}` : 'No fixed day'}
                  {item.default_account_id && accountById(item.default_account_id) ? ` · ${accountById(item.default_account_id)!.account_name}` : ''}
                  {item.debt_id && debtById(item.debt_id) ? ` → ${debtById(item.debt_id)!.debt_name}` : ''}
                </p>
              </div>
              <p className="text-sm font-bold font-mono-num shrink-0">{fmt(item.default_amount)}</p>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
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
            <DialogTitle className="font-display">{editTarget ? 'Edit Recurring Item' : 'New Recurring Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Item Name *</Label>
                <Input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} className="font-body" placeholder="e.g. Discovery Health" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Type *</Label>
                <Select value={form.item_type} onValueChange={v => setForm(f => ({ ...f, item_type: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="font-body">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Default Amount (R) *</Label>
                <Input type="number" step="0.01" value={form.default_amount} onChange={e => setForm(f => ({ ...f, default_amount: e.target.value }))} className="font-body" placeholder="0.00" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(fr => <SelectItem key={fr.value} value={fr.value} className="font-body">{fr.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Due Day (1–31)</Label>
                <Input type="number" min={1} max={31} value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} className="font-body" placeholder="e.g. 25" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Default Account</Label>
                <Select value={form.default_account_id} onValueChange={v => setForm(f => ({ ...f, default_account_id: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">None</SelectItem>
                    {accounts.map(a => <SelectItem key={a.account_id} value={a.account_id} className="font-body">{a.account_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.item_type === 'debt_payment' && (
                <div>
                  <Label className="font-body text-xs mb-1 block">Linked Debt</Label>
                  <Select value={form.debt_id} onValueChange={v => setForm(f => ({ ...f, debt_id: v }))}>
                    <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="font-body">None</SelectItem>
                      {debts.map(d => <SelectItem key={d.debt_id} value={d.debt_id} className="font-body">{d.debt_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="font-body text-xs mb-1 block">Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">None</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id} className="font-body">{c.category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="font-body" />
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">End Date (optional)</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="font-body" />
              </div>
              <div className="col-span-2">
                <Label className="font-body text-xs mb-1 block">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-body" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ri_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <Label htmlFor="ri_active" className="font-body text-xs">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto_gen" checked={form.auto_generate} onChange={e => setForm(f => ({ ...f, auto_generate: e.target.checked }))} />
                <Label htmlFor="auto_gen" className="font-body text-xs">Auto-generate monthly</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} disabled={saving} className="flex-1 bg-primary text-primary-foreground font-body">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Recurring Item'}
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
            <AlertDialogTitle className="font-display">Delete Recurring Item?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong>{deleteTarget?.item_name}</strong> will be deleted. Existing monthly obligations will not be affected.
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
