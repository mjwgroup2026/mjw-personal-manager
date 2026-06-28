import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { PersonalAuditLog } from '@/types/personal-budget';
import { fmt, fmtDate } from './shared';
import { getDeletedRecords, getAuditLog, restoreAccount, permanentDeleteAccount, restoreDebt } from '@/lib/personal-budget-service';
import { useToast } from '@/hooks/use-toast';

interface Props {
  userId: string;
  onRefresh: () => void;
}

export default function AuditTab({ userId, onRefresh }: Props) {
  const { toast } = useToast();
  const [deleted, setDeleted] = useState<Awaited<ReturnType<typeof getDeletedRecords>> | null>(null);
  const [auditLog, setAuditLog] = useState<PersonalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [permDeleteTarget, setPermDeleteTarget] = useState<{ id: string; type: string; label: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, log] = await Promise.all([getDeletedRecords(userId), getAuditLog(userId)]);
      setDeleted(d);
      setAuditLog(log);
    } catch (e: unknown) {
      toast({ title: 'Error loading audit data', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const restore = async (type: string, id: string) => {
    try {
      if (type === 'account') await restoreAccount(userId, id);
      else if (type === 'debt') await restoreDebt(userId, id);
      else {
        await supabase.from(`personal_${type}s`).update({ deleted_at: null }).eq('id', id);
      }
      await load();
      onRefresh();
      toast({ title: 'Record restored' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const doPermanentDelete = async () => {
    if (!permDeleteTarget) return;
    try {
      const tableMap: Record<string, string> = {
        account: 'personal_accounts', debt: 'personal_debts',
        transaction: 'personal_transactions', obligation: 'personal_monthly_obligations',
        recurring: 'personal_recurring_items',
      };
      const table = tableMap[permDeleteTarget.type];
      if (table) {
        await supabase.from(table).delete().eq('id', permDeleteTarget.id);
      }
      setPermDeleteTarget(null);
      await load();
      onRefresh();
      toast({ title: 'Permanently deleted' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  const hasDeleted = deleted && (
    deleted.accounts.length + deleted.debts.length + deleted.transactions.length +
    deleted.obligations.length + deleted.recurring.length > 0
  );

  type DeletedItem = { id: string; label: string; amount?: number; deleted_at: string };
  const sections: { type: string; label: string; items: DeletedItem[] }[] = deleted ? [
    { type: 'account', label: 'Accounts', items: deleted.accounts.map(a => ({ id: a.id, label: a.account_name, deleted_at: a.deleted_at! })) },
    { type: 'debt', label: 'Debts', items: deleted.debts.map(d => ({ id: d.id, label: d.debt_name, deleted_at: d.deleted_at! })) },
    { type: 'transaction', label: 'Transactions', items: deleted.transactions.map(t => ({ id: t.id, label: t.description, amount: t.amount, deleted_at: t.deleted_at! })) },
    { type: 'obligation', label: 'Obligations', items: deleted.obligations.map(o => ({ id: o.id, label: o.obligation_name, amount: o.expected_amount, deleted_at: o.deleted_at! })) },
    { type: 'recurring', label: 'Recurring Items', items: deleted.recurring.map(r => ({ id: r.id, label: r.item_name, amount: r.default_amount, deleted_at: r.deleted_at! })) },
  ] : [];

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold font-body text-muted-foreground uppercase tracking-wider">Recycle Bin & Audit Log</h2>

      {/* Deleted records */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Deleted Records</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <p className="text-xs text-muted-foreground font-body">Loading…</p>
          ) : !hasDeleted ? (
            <p className="text-xs text-muted-foreground font-body">No deleted records.</p>
          ) : (
            <div className="space-y-4">
              {sections.map(section => section.items.length > 0 && (
                <div key={section.type}>
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">{section.label}</p>
                  <div className="space-y-1.5">
                    {section.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 text-xs font-body border border-border rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">Deleted: {fmtDate(item.deleted_at)}</p>
                        </div>
                        {item.amount != null && <span className="font-mono-num shrink-0">{fmt(item.amount)}</span>}
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="outline" className="h-6 w-6" title="Restore" onClick={() => restore(section.type, item.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" title="Permanent Delete"
                            onClick={() => setPermDeleteTarget({ id: item.id, type: section.type, label: item.label })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {auditLog.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body">No audit entries yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {auditLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 text-xs font-body border-b border-border pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{entry.action.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground capitalize">{entry.entity_type.replace('_', ' ')}</span>
                    </div>
                    {entry.reason && <p className="text-[10px] text-muted-foreground">{entry.reason}</p>}
                    {entry.old_values && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        Before: {JSON.stringify(entry.old_values).slice(0, 80)}
                      </p>
                    )}
                    {entry.new_values && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        After: {JSON.stringify(entry.new_values).slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(entry.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!permDeleteTarget} onOpenChange={() => setPermDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm">
              <strong>{permDeleteTarget?.label}</strong> will be permanently and irreversibly deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={doPermanentDelete} className="font-body">Permanently Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
