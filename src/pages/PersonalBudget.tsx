import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { BudgetCategory, BudgetTransaction } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const COLORS = ["#3b82f6","#22c55e","#f97316","#a855f7","#f43f5e","#06b6d4","#eab308","#ec4899","#14b8a6","#8b5cf6"];

const blankCat = (): Partial<BudgetCategory> => ({ name: "", budget: 0, color: COLORS[0] });
const blankTx = () => ({ description: "", amount: "", categoryId: "", date: format(new Date(), "yyyy-MM-dd"), type: "expense" as "expense" | "income" });

export default function PersonalBudget() {
  const { money, setMoney } = usePersonalData();
  const [catOpen, setCatOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [catForm, setCatForm] = useState<Partial<BudgetCategory>>(blankCat());
  const [txForm, setTxForm] = useState(blankTx());
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthLabel = format(now, "MMMM yyyy");

  const cats = money.categories ?? [];
  const txs = money.transactions ?? [];

  const monthTxs = txs.filter((t) => {
    const d = parseISO(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = (money.monthlyIncome ?? 0) + totalIncome - totalExpense;

  const spentInCat = (catId: string) =>
    monthTxs.filter((t) => t.type === "expense" && t.categoryId === catId).reduce((s, t) => s + t.amount, 0);

  const totalBudget = cats.reduce((s, c) => s + c.budget, 0);

  const saveCat = () => {
    if (!catForm.name?.trim()) return;
    const now2 = new Date().toISOString();
    if (editCatId) {
      setMoney((m) => ({ ...m, categories: (m.categories ?? []).map((c) => c.id === editCatId ? { ...c, ...catForm } as BudgetCategory : c) }));
    } else {
      const newCat: BudgetCategory = { id: crypto.randomUUID(), name: catForm.name!, budget: catForm.budget ?? 0, color: catForm.color ?? COLORS[0] };
      setMoney((m) => ({ ...m, categories: [...(m.categories ?? []), newCat] }));
    }
    setCatOpen(false); setCatForm(blankCat()); setEditCatId(null);
  };

  const removeCat = (id: string) => setMoney((m) => ({ ...m, categories: (m.categories ?? []).filter((c) => c.id !== id) }));

  const saveTx = () => {
    if (!txForm.description.trim() || !txForm.amount) return;
    const tx: BudgetTransaction = {
      id: crypto.randomUUID(), description: txForm.description,
      amount: parseFloat(txForm.amount as string), categoryId: txForm.categoryId || undefined,
      date: txForm.date, type: txForm.type, createdAt: new Date().toISOString(),
    };
    setMoney((m) => ({ ...m, transactions: [tx, ...(m.transactions ?? [])] }));
    setTxOpen(false); setTxForm(blankTx());
  };

  const removeTx = (id: string) => setMoney((m) => ({ ...m, transactions: (m.transactions ?? []).filter((t) => t.id !== id) }));

  const recentTxs = [...monthTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2"><Wallet className="h-6 w-6 text-accent" />Personal Budget</h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="font-body text-xs" onClick={() => { setCatForm(blankCat()); setEditCatId(null); setCatOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Category
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-body text-xs" onClick={() => { setTxForm(blankTx()); setTxOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Transaction
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Monthly Income</p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={money.monthlyIncome ?? 0}
                onChange={(e) => setMoney((m) => ({ ...m, monthlyIncome: parseFloat(e.target.value) || 0 }))}
                className="text-lg font-bold font-body text-foreground bg-transparent border-none outline-none w-full p-0"
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">Click to edit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Extra Income</p>
            <p className="text-lg font-bold font-body text-green-600">R {totalIncome.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</p>
            <div className="flex items-center gap-1 mt-0.5"><TrendingUp className="h-3 w-3 text-green-500" /><p className="text-[10px] text-muted-foreground font-body">this month</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-lg font-bold font-body text-red-500">R {totalExpense.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</p>
            <div className="flex items-center gap-1 mt-0.5"><TrendingDown className="h-3 w-3 text-red-400" /><p className="text-[10px] text-muted-foreground font-body">this month</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
            <p className={`text-lg font-bold font-body ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
              R {Math.abs(balance).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">{balance >= 0 ? "surplus" : "over budget"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget categories */}
        <div>
          <h2 className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wider mb-3">Budget Categories</h2>
          {cats.length === 0 && (
            <Card><CardContent className="py-6 text-center"><p className="text-xs text-muted-foreground font-body">No categories yet. Add one to start tracking your budget.</p></CardContent></Card>
          )}
          <div className="space-y-2">
            {cats.map((cat) => {
              const spent = spentInCat(cat.id);
              const pct = cat.budget > 0 ? Math.min((spent / cat.budget) * 100, 100) : 0;
              const over = spent > cat.budget && cat.budget > 0;
              return (
                <Card key={cat.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { setCatForm({ name: cat.name, budget: cat.budget, color: cat.color }); setEditCatId(cat.id); setCatOpen(true); }}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                        <p className="text-xs font-bold font-body text-foreground">{cat.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-body font-bold ${over ? "text-red-500" : "text-foreground"}`}>
                          R {spent.toLocaleString("en-ZA", { minimumFractionDigits: 0 })} <span className="font-normal text-muted-foreground">/ R {cat.budget.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</span>
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); removeCat(cat.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${over ? "bg-red-500" : ""}`} style={{ width: `${pct}%`, background: over ? undefined : cat.color }} />
                    </div>
                    {over && <p className="text-[10px] text-red-500 font-body mt-1">R {(spent - cat.budget).toLocaleString("en-ZA", { minimumFractionDigits: 0 })} over budget</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {cats.length > 0 && (
            <div className="mt-3 px-1">
              <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                <span>Total budget</span><span>R {totalBudget.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${totalBudget > 0 ? Math.min((totalExpense / totalBudget) * 100, 100) : 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div>
          <h2 className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wider mb-3">This Month — Transactions</h2>
          {recentTxs.length === 0 && (
            <Card><CardContent className="py-6 text-center"><p className="text-xs text-muted-foreground font-body">No transactions logged this month.</p></CardContent></Card>
          )}
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {recentTxs.map((tx) => {
              const cat = cats.find((c) => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0" style={{ background: cat?.color ? `${cat.color}20` : "#f3f4f6" }}>
                    {tx.type === "income" ? <TrendingUp className="h-3.5 w-3.5 text-green-500" /> : <TrendingDown className="h-3.5 w-3.5" style={{ color: cat?.color ?? "#9ca3af" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{cat?.name ?? (tx.type === "income" ? "Income" : "Uncategorised")} · {format(parseISO(tx.date), "d MMM")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold font-body ${tx.type === "income" ? "text-green-600" : "text-foreground"}`}>
                      {tx.type === "income" ? "+" : "-"}R {tx.amount.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
                    </span>
                    <button onClick={() => removeTx(tx.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editCatId ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label className="font-body text-xs mb-1 block">Category Name</Label><Input value={catForm.name ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Groceries" className="font-body" /></div>
            <div><Label className="font-body text-xs mb-1 block">Monthly Budget (R)</Label><Input type="number" value={catForm.budget ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, budget: parseFloat(e.target.value) || 0 }))} placeholder="0.00" className="font-body" /></div>
            <div>
              <Label className="font-body text-xs mb-2 block">Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setCatForm((f) => ({ ...f, color: c }))}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${catForm.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={saveCat} className="flex-1 bg-primary text-primary-foreground font-body">{editCatId ? "Save" : "Add Category"}</Button>
              <Button variant="outline" onClick={() => setCatOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Log Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs mb-1 block">Type</Label>
                <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: v as "expense" | "income" }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense" className="font-body">Expense</SelectItem>
                    <SelectItem value="income" className="font-body">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-xs mb-1 block">Date</Label>
                <Input type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} className="font-body" />
              </div>
            </div>
            <div><Label className="font-body text-xs mb-1 block">Description</Label><Input value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Pick n Pay groceries" className="font-body" /></div>
            <div><Label className="font-body text-xs mb-1 block">Amount (R)</Label><Input type="number" step="0.01" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="font-body" /></div>
            {txForm.type === "expense" && cats.length > 0 && (
              <div>
                <Label className="font-body text-xs mb-1 block">Category (optional)</Label>
                <Select value={txForm.categoryId} onValueChange={(v) => setTxForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="font-body text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="font-body">Uncategorised</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id} className="font-body">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={saveTx} className="flex-1 bg-primary text-primary-foreground font-body">Log Transaction</Button>
              <Button variant="outline" onClick={() => setTxOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
