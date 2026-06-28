import { useEffect, useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, RotateCcw } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";

type BudgetItem = Tables<"budget_items"> & { expense_codes?: { code: string; name: string } | null };
type TransactionType = Database["public"]["Enums"]["transaction_type"];
type ExpenseCode = Tables<"expense_codes">;

const Budget = () => {
  const { selectedEntity } = useEntity();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [expenseCodes, setExpenseCodes] = useState<ExpenseCode[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    budget_type: "expense" as TransactionType,
    expense_code_id: "",
    is_recurring: false,
  });

  useEffect(() => {
    supabase.from("expense_codes").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setExpenseCodes(data ?? []);
    });
  }, []);

  const fetchBudgetItems = async () => {
    if (!selectedEntity) return;
    const start = format(currentMonth, "yyyy-MM-dd");
    let query = supabase
      .from("budget_items")
      .select("*, expense_codes(code, name)")
      .eq("entity_id", selectedEntity.id)
      .eq("month", start)
      .order("created_at");

    if (!showDeleted) query = query.eq("is_deleted", false);

    const { data } = await query;
    setBudgetItems((data as BudgetItem[]) ?? []);
  };

  useEffect(() => {
    if (!selectedEntity) return;
    const start = format(currentMonth, "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    supabase
      .from("transactions")
      .select("transaction_type, net_amount")
      .eq("entity_id", selectedEntity.id)
      .eq("is_current", true)
      .gte("date", start)
      .lte("date", end)
      .then(({ data }) => {
        let inc = 0, exp = 0;
        (data ?? []).forEach((t) => {
          if (t.transaction_type === "income" || t.transaction_type === "invoice") inc += Number(t.net_amount);
          else if (t.transaction_type === "expense") exp += Number(t.net_amount);
        });
        setIncome(inc);
        setExpenses(exp);
      });

    fetchBudgetItems();
  }, [selectedEntity, currentMonth, showDeleted]);

  const budgetedIncome = budgetItems.filter(b => !b.is_deleted && (b.budget_type === "income" || b.budget_type === "invoice")).reduce((s, b) => s + Number(b.amount), 0);
  const budgetedExpenses = budgetItems.filter(b => !b.is_deleted && b.budget_type === "expense").reduce((s, b) => s + Number(b.amount), 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  const resetForm = () => {
    setForm({ description: "", amount: "", budget_type: "expense", expense_code_id: "", is_recurring: false });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!user || !selectedEntity) return;
    const monthStr = format(currentMonth, "yyyy-MM-dd");

    const payload = {
      entity_id: selectedEntity.id,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      budget_type: form.budget_type,
      expense_code_id: form.expense_code_id || null,
      is_recurring: form.is_recurring,
      month: monthStr,
      created_by: user.id,
    };

    if (editingId) {
      await supabase.from("budget_items").update(payload).eq("id", editingId);
    } else {
      await supabase.from("budget_items").insert(payload);
    }

    await fetchBudgetItems();
    resetForm();
    setDialogOpen(false);
  };

  const handleSoftDelete = async (id: string) => {
    await supabase.from("budget_items").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Budget item archived" });
    await fetchBudgetItems();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("budget_items").update({ is_deleted: false }).eq("id", id);
    toast({ title: "Budget item restored" });
    await fetchBudgetItems();
  };

  const openEdit = (item: BudgetItem) => {
    setForm({
      description: item.description,
      amount: String(item.amount),
      budget_type: item.budget_type,
      expense_code_id: item.expense_code_id ?? "",
      is_recurring: item.is_recurring,
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  if (!selectedEntity) {
    return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select an entity.</p></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget & Cashflow</h1>
          <div className="mt-1 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">{format(currentMonth, "MMMM yyyy")}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {role === "owner" && (
            <div className="flex items-center gap-2">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted-budget" />
              <Label htmlFor="show-deleted-budget" className="text-sm">Show Deleted</Label>
            </div>
          )}
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Budget Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Budget Item" : "New Budget Item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.budget_type} onValueChange={(v) => setForm(f => ({ ...f, budget_type: v as TransactionType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Amount (ZAR)</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                {form.budget_type === "expense" && (
                  <div className="space-y-2">
                    <Label>Expense Code</Label>
                    <Select value={form.expense_code_id} onValueChange={(v) => setForm(f => ({ ...f, expense_code_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {expenseCodes.map((ec) => (
                          <SelectItem key={ec.id} value={ec.id}>{ec.code} — {ec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="recurring" checked={form.is_recurring} onChange={(e) => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
                  <Label htmlFor="recurring" className="cursor-pointer">Recurring monthly</Label>
                </div>
                <Button onClick={handleSave} className="w-full">{editingId ? "Update" : "Add"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Income</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(income)}</div>
            <p className="text-xs text-muted-foreground">Budgeted: {formatCurrency(budgetedIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Expenses</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(expenses)}</div>
            <p className="text-xs text-muted-foreground">Budgeted: {formatCurrency(budgetedExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Available</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${income - expenses >= 0 ? "text-green-600" : "text-red-500"}`}>
              {formatCurrency(income - expenses)}
            </div>
            <p className="text-xs text-muted-foreground">Budgeted: {formatCurrency(budgetedIncome - budgetedExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Budget Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No budget items for this month</TableCell></TableRow>
              ) : (
                budgetItems.map((item) => (
                  <TableRow key={item.id} className={item.is_deleted ? "opacity-50" : ""}>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${item.budget_type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {item.budget_type}
                      </Badge>
                      {item.is_deleted && <Badge variant="destructive" className="ml-1 text-xs">Deleted</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.description}
                      {item.is_recurring && <Badge variant="outline" className="ml-2 text-xs">recurring</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.expense_codes?.code ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(item.amount))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!item.is_deleted ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete budget item?</AlertDialogTitle>
                                  <AlertDialogDescription>This will archive the item. It can be restored later.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSoftDelete(item.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(item.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Budget;
