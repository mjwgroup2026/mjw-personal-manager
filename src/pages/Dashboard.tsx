import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, Plus, Building2, Calculator, Lock, Receipt,
  FileText, ChevronLeft, ChevronRight, ArrowLeftRight, AlertTriangle, Upload, Car,
  Shield, FileCheck, Clock, BarChart3,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

const entityTypeLabels: Record<string, string> = {
  personal: "Personal", sole_prop: "Sole Prop", pty_ltd: "PTY Ltd", trust: "Trust", landlord: "Landlord",
};

const typeColors: Record<string, string> = {
  income: "bg-success/10 text-success",
  expense: "bg-destructive/10 text-destructive",
  invoice: "bg-secondary/10 text-secondary",
  vat_adjustment: "bg-warning/10 text-warning",
};

const Dashboard = () => {
  const { selectedEntity } = useEntity();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ income: 0, expenses: 0, net: 0, txCount: 0, vatOut: 0, vatIn: 0 });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [locking, setLocking] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [overdueInvoices, setOverdueInvoices] = useState(0);

  const monthStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentDate), "yyyy-MM-dd");
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  const getTaxYear = (date: Date) => {
    const m = date.getMonth();
    const y = date.getFullYear();
    return m >= 2 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  };

  useEffect(() => {
    if (!selectedEntity) return;
    const fetchAll = async () => {
      const { data: txData } = await supabase
        .from("transactions").select("transaction_type, net_amount, vat_amount")
        .eq("entity_id", selectedEntity.id).eq("is_current", true)
        .gte("date", monthStart).lte("date", monthEnd);

      let income = 0, expenses = 0, vatOut = 0, vatIn = 0;
      (txData ?? []).forEach((t) => {
        if (t.transaction_type === "income" || t.transaction_type === "invoice") { income += Number(t.net_amount); vatOut += Number(t.vat_amount); }
        else if (t.transaction_type === "expense") { expenses += Number(t.net_amount); vatIn += Number(t.vat_amount); }
      });
      setStats({ income, expenses, net: income - expenses, txCount: txData?.length ?? 0, vatOut, vatIn });

      const { data: recent } = await supabase
        .from("transactions").select("*, expense_codes(code, name)")
        .eq("entity_id", selectedEntity.id).eq("is_current", true)
        .gte("date", monthStart).lte("date", monthEnd)
        .order("date", { ascending: false }).limit(10);
      setRecentTxns(recent ?? []);

      const { data: locks } = await supabase
        .from("period_locks").select("id")
        .eq("entity_id", selectedEntity.id).eq("locked_month", monthStart).limit(1);
      setIsLocked((locks?.length ?? 0) > 0);

      const today = format(new Date(), "yyyy-MM-dd");
      const { count } = await supabase
        .from("invoices").select("id", { count: "exact", head: true })
        .eq("entity_id", selectedEntity.id).eq("status", "issued").eq("is_deleted", false).lt("due_date", today);
      setOverdueInvoices(count ?? 0);
    };
    fetchAll();
  }, [selectedEntity, monthStart, monthEnd]);

  const handleLockPeriod = async () => {
    if (!selectedEntity) return;
    setLocking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("period_locks").insert({ entity_id: selectedEntity.id, locked_month: monthStart, locked_by: user.id });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setIsLocked(true); toast({ title: "Period locked" }); }
    setLocking(false);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  if (!selectedEntity) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
            <Building2 className="h-7 w-7 text-secondary" />
          </div>
          <h2 className="text-lg font-bold font-display mb-2">No entity selected</h2>
          <p className="mb-5 text-sm text-muted-foreground font-body">Create or select an entity to start managing your financial operations.</p>
          <Button onClick={() => navigate("/app/entities/new")} className="bg-accent text-accent-foreground hover:bg-accent/90 font-body">
            <Plus className="mr-1.5 h-4 w-4" /> Create Entity
          </Button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Income", value: formatCurrency(stats.income), icon: ArrowDownLeft, color: "text-success", bg: "bg-success/10" },
    { label: "Expenses", value: formatCurrency(stats.expenses), icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Net Profit", value: formatCurrency(stats.net), icon: TrendingUp, color: stats.net >= 0 ? "text-success" : "text-destructive", bg: stats.net >= 0 ? "bg-success/10" : "bg-destructive/10" },
    { label: "VAT Output", value: formatCurrency(stats.vatOut), icon: Receipt, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "VAT Input", value: formatCurrency(stats.vatIn), icon: Receipt, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Net VAT", value: formatCurrency(stats.vatOut - stats.vatIn), icon: Calculator, color: stats.vatOut - stats.vatIn >= 0 ? "text-warning" : "text-success", bg: stats.vatOut - stats.vatIn >= 0 ? "bg-warning/10" : "bg-success/10" },
  ];

  const quickActions = [
    { label: "New Transaction", to: "/app/transactions/new", icon: Plus },
    { label: "New Invoice", to: "/app/invoices/new", icon: Receipt },
    { label: "Upload Document", to: "/app/documents", icon: Upload },
    { label: "Import CSV", to: "/app/imports", icon: FileText },
    { label: "Income Tax", to: "/app/tax", icon: Calculator },
    { label: "VAT Period", to: "/app/vat", icon: Shield },
    { label: "Vehicles", to: "/app/vehicles", icon: Car },
    { label: "Reports", to: "/app/reports", icon: BarChart3 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-display">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground font-body">{selectedEntity.trading_name || selectedEntity.legal_name}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-sm text-muted-foreground font-body">{format(currentDate, "MMMM yyyy")}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground font-body">Tax year {getTaxYear(currentDate)}</span>
            {selectedEntity.vat_status === 'registered' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-accent border-accent/30 font-body">VAT</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Select value={format(currentDate, "yyyy-MM")} onValueChange={(v) => setCurrentDate(new Date(v + "-01"))}>
            <SelectTrigger className="h-8 w-40 text-xs font-body"><SelectValue /></SelectTrigger>
            <SelectContent>{monthOptions.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
          {isLocked ? (
            <Badge className="gap-1 text-xs bg-accent/10 text-accent border border-accent/20 font-body"><Lock className="h-3 w-3" /> Locked</Badge>
          ) : role === "owner" ? (
            <Button variant="outline" size="sm" className="h-8 text-xs font-body" onClick={handleLockPeriod} disabled={locking}>
              <Lock className="mr-1 h-3 w-3" /> {locking ? "…" : "Lock Period"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border hover:border-accent/20 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide font-body">{label}</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
              </div>
              <p className="text-base font-bold font-mono-num tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {overdueInvoices > 0 && (
        <div className="mb-6">
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground font-body">{overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground font-body">Review and follow up on outstanding payments</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs shrink-0 font-body" onClick={() => navigate("/app/invoices")}>View</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground font-body">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
          {quickActions.map(({ label, to, icon: Icon }) => (
            <Card key={to} className="cursor-pointer border-border transition-all hover:border-accent/30 hover:shadow-sm group" onClick={() => navigate(to)}>
              <CardContent className="flex flex-col items-center text-center gap-2 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 group-hover:bg-accent/10 transition-colors">
                  <Icon className="h-4 w-4 text-secondary group-hover:text-accent transition-colors" />
                </div>
                <span className="text-[11px] font-medium leading-tight font-body">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <CardTitle className="text-sm font-bold font-body">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-accent font-body" onClick={() => navigate("/app/transactions")}>View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ArrowLeftRight className="mb-3 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground font-body">No transactions this month</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs font-body border-accent/30 text-accent hover:bg-accent/5" onClick={() => navigate("/app/transactions/new")}>
                    <Plus className="mr-1 h-3 w-3" /> Add Transaction
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Date</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Type</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body">Description</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body hidden md:table-cell">Code</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide font-body text-right">Net (ZAR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTxns.map((tx) => (
                      <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/app/transactions/${tx.id}`)}>
                        <TableCell className="text-xs py-3 font-body">{format(new Date(tx.date), "dd MMM")}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className={`text-[10px] font-medium font-body ${typeColors[tx.transaction_type] ?? ""}`}>
                            {tx.transaction_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs py-3 font-body">{tx.description}</TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell py-3 font-body">{tx.expense_codes?.code ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs font-semibold font-mono-num py-3">{formatCurrency(tx.net_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-4 px-5"><CardTitle className="text-sm font-bold font-body">Entity Status</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Type</span>
                <Badge variant="outline" className="text-[10px] font-body">{entityTypeLabels[selectedEntity.entity_type]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">VAT</span>
                <Badge variant="outline" className={`text-[10px] font-body ${selectedEntity.vat_status === 'registered' ? 'text-success border-success/30' : ''}`}>
                  {selectedEntity.vat_status === 'registered' ? 'Registered' : 'Not Registered'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Period</span>
                <Badge variant="outline" className={`text-[10px] font-body ${isLocked ? 'text-accent border-accent/30' : ''}`}>{isLocked ? 'Locked' : 'Open'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Transactions</span>
                <span className="text-xs font-semibold font-mono-num">{stats.txCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 px-5"><CardTitle className="text-sm font-bold font-body">Tax Position</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Tax Year</span>
                <span className="text-xs font-medium font-body">{getTaxYear(currentDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-body">Month Net</span>
                <span className={`text-xs font-semibold font-mono-num ${stats.net >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(stats.net)}</span>
              </div>
              {selectedEntity.vat_status === 'registered' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-body">Net VAT</span>
                  <span className={`text-xs font-semibold font-mono-num ${stats.vatOut - stats.vatIn >= 0 ? 'text-warning' : 'text-success'}`}>{formatCurrency(stats.vatOut - stats.vatIn)}</span>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full text-xs mt-1 font-body" onClick={() => navigate("/app/tax")}>
                <Calculator className="mr-1.5 h-3 w-3" /> View Tax Summary
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 px-5"><CardTitle className="text-sm font-bold font-body">Compliance</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-body"><FileCheck className="h-3.5 w-3.5 text-success" /><span className="text-muted-foreground">Audit trail active</span></div>
              <div className="flex items-center gap-2 text-xs font-body">
                {isLocked ? <Lock className="h-3.5 w-3.5 text-accent" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-muted-foreground">Period {isLocked ? "locked" : "open"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-body"><Shield className="h-3.5 w-3.5 text-secondary" /><span className="text-muted-foreground">Version control enabled</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
