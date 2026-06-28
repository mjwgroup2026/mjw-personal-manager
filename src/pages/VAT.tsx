import { useEffect, useState, useRef } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Printer, FileText, AlertTriangle, Download, Plus, CheckCircle, Lock } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { exportCSV, exportPDF, generateDateFilename } from "@/lib/export-utils";

interface VatTransaction {
  id: string; date: string; description: string; transaction_type: string;
  gross_amount: number; vat_amount: number; net_amount: number; vat_treatment: string; has_document: boolean;
}

const VAT = () => {
  const { selectedEntity } = useEntity();
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<VatTransaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [periods, setPeriods] = useState<any[]>([]);
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodNotes, setPeriodNotes] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const monthStart = format(startOfMonth(new Date(selectedMonth + "-01")), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(selectedMonth + "-01")), "yyyy-MM-dd");

  useEffect(() => {
    if (!selectedEntity) return;
    setLoading(true);
    const fetchVat = async () => {
      const { data: txData } = await supabase
        .from("transactions")
        .select("id, date, description, transaction_type, gross_amount, vat_amount, net_amount, vat_treatment")
        .eq("entity_id", selectedEntity.id)
        .eq("is_current", true)
        .eq("vat_treatment", "standard")
        .gte("date", monthStart).lte("date", monthEnd)
        .order("date", { ascending: true });

      const txIds = (txData ?? []).map((t) => t.id);
      let docMap: Record<string, boolean> = {};
      if (txIds.length > 0) {
        const { data: docs } = await supabase
          .from("documents").select("transaction_id").in("transaction_id", txIds).eq("is_deleted", false);
        (docs ?? []).forEach((d: any) => { if (d.transaction_id) docMap[d.transaction_id] = true; });
      }
      setTransactions((txData ?? []).map((t) => ({ ...t, has_document: !!docMap[t.id] })));
      setLoading(false);
    };
    fetchVat();
  }, [selectedEntity, selectedMonth]);

  // Fetch VAT periods
  useEffect(() => {
    if (!selectedEntity) return;
    supabase.from("vat_periods").select("*").eq("entity_id", selectedEntity.id).order("period_start", { ascending: false })
      .then(({ data }) => setPeriods(data ?? []));
  }, [selectedEntity]);

  const outputVat = transactions.filter(t => t.transaction_type === "income" || t.transaction_type === "invoice").reduce((s, t) => s + Number(t.vat_amount), 0);
  const inputVat = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.vat_amount), 0);
  const netVat = outputVat - inputVat;
  const missingDocs = transactions.filter(t => !t.has_document).length;

  const formatCurrency = (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  const handleCreatePeriod = async () => {
    if (!selectedEntity || !user || !periodStart || !periodEnd) return;
    // Calculate VAT for the period
    const { data: txData } = await supabase
      .from("transactions")
      .select("transaction_type, vat_amount")
      .eq("entity_id", selectedEntity.id)
      .eq("is_current", true)
      .eq("vat_treatment", "standard")
      .gte("date", periodStart).lte("date", periodEnd);

    const out = (txData ?? []).filter(t => t.transaction_type === "income" || t.transaction_type === "invoice").reduce((s, t) => s + Number(t.vat_amount), 0);
    const inp = (txData ?? []).filter(t => t.transaction_type === "expense").reduce((s, t) => s + Number(t.vat_amount), 0);

    const { error } = await supabase.from("vat_periods").insert({
      entity_id: selectedEntity.id,
      period_start: periodStart,
      period_end: periodEnd,
      output_vat: out,
      input_vat: inp,
      net_vat: out - inp,
      notes: periodNotes || null,
      status: "draft",
      created_by: user.id,
    });

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "VAT period created" });
    setShowNewPeriod(false);
    setPeriodStart(""); setPeriodEnd(""); setPeriodNotes("");
    // Refresh
    const { data: fresh } = await supabase.from("vat_periods").select("*").eq("entity_id", selectedEntity.id).order("period_start", { ascending: false });
    setPeriods(fresh ?? []);
  };

  const handleFinalizePeriod = async (periodId: string) => {
    await supabase.from("vat_periods").update({ status: "finalized", submitted_at: new Date().toISOString() }).eq("id", periodId);
    toast({ title: "Period finalized" });
    const { data: fresh } = await supabase.from("vat_periods").select("*").eq("entity_id", selectedEntity.id).order("period_start", { ascending: false });
    setPeriods(fresh ?? []);
  };

  const handleExportVatPack = async (period: any) => {
    if (!selectedEntity) return;
    const { data } = await supabase
      .from("transactions")
      .select("date, transaction_type, description, gross_amount, vat_amount, net_amount")
      .eq("entity_id", selectedEntity.id)
      .eq("is_current", true)
      .eq("vat_treatment", "standard")
      .gte("date", period.period_start).lte("date", period.period_end)
      .order("date");
    const formatted = (data ?? []).map(t => ({
      Date: t.date, Type: t.transaction_type, Description: t.description,
      Gross: Number(t.gross_amount).toFixed(2), VAT: Number(t.vat_amount).toFixed(2), Net: Number(t.net_amount).toFixed(2),
    }));
    const filename = generateDateFilename("VAT_Support_Pack", selectedEntity.trading_name || selectedEntity.legal_name, period.period_start, period.period_end);
    exportCSV(formatted, filename);
    toast({ title: "VAT support pack exported" });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>VAT Report</title><style>body{font-family:Arial;padding:40px;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}.r{text-align:right}.summary{margin-top:24px}.summary div{display:flex;justify-content:space-between;padding:4px 0}. bold{font-weight:bold;border-top:2px solid #333;padding-top:8px;margin-top:8px}</style></head><body>
      <h2>VAT Report – ${selectedEntity?.trading_name || selectedEntity?.legal_name}</h2>
      <p>Period: ${format(new Date(monthStart), "dd MMM yyyy")} – ${format(new Date(monthEnd), "dd MMM yyyy")}</p>
      ${selectedEntity?.vat_number ? `<p>VAT Number: ${selectedEntity.vat_number}</p>` : ""}
      <table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th class="r">Gross</th><th class="r">VAT</th><th class="r">Net</th><th>Doc</th></tr></thead><tbody>
      ${transactions.map(tx => `<tr><td>${format(new Date(tx.date), "dd MMM yyyy")}</td><td>${tx.transaction_type}</td><td>${tx.description}</td><td class="r">${formatCurrency(tx.gross_amount)}</td><td class="r">${formatCurrency(tx.vat_amount)}</td><td class="r">${formatCurrency(tx.net_amount)}</td><td>${tx.has_document ? "✓" : "⚠"}</td></tr>`).join("")}
      </tbody></table>
      <div class="summary"><div><span>Output VAT:</span><span>${formatCurrency(outputVat)}</span></div><div><span>Input VAT:</span><span>${formatCurrency(inputVat)}</span></div><div class="bold"><span>Net VAT:</span><span>${formatCurrency(Math.abs(netVat))}</span></div></div>
      <p style="margin-top:40px;color:#999;font-size:10px">Generated by Ledgera · ${format(new Date(), "dd MMM yyyy HH:mm")}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  if (!selectedEntity) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select an entity.</p></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">VAT</h1>
          <p className="text-sm text-muted-foreground">SARS VAT reporting for {selectedEntity.trading_name || selectedEntity.legal_name}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="periods">VAT Periods ({periods.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => {
              const formatted = transactions.map(t => ({
                Date: t.date, Type: t.transaction_type, Description: t.description,
                Gross: Number(t.gross_amount).toFixed(2), VAT: Number(t.vat_amount).toFixed(2), Net: Number(t.net_amount).toFixed(2),
                Document: t.has_document ? "Attached" : "Missing",
              }));
              exportCSV(formatted, generateDateFilename("VAT_Transactions", selectedEntity?.trading_name || selectedEntity?.legal_name, monthStart, monthEnd));
              toast({ title: "Exported" });
            }}><Download className="mr-1 h-3 w-3" />Export CSV</Button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Output VAT</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(outputVat)}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Input VAT</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(inputVat)}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net VAT {netVat >= 0 ? "Payable" : "Refundable"}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${netVat >= 0 ? "text-red-500" : "text-green-600"}`}>{formatCurrency(Math.abs(netVat))}</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Missing Docs</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${missingDocs > 0 ? "text-warning" : "text-success"}`}>{missingDocs}</div></CardContent></Card>
          </div>

          <div ref={printRef}>
            <Card>
              <CardHeader><CardTitle className="text-base">VAT Transactions – {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {loading ? <div className="py-12 text-center text-muted-foreground">Loading...</div> : transactions.length === 0 ? (
                  <div className="flex flex-col items-center py-12"><FileText className="mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No VAT transactions this period</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead>
                      <TableHead className="text-right">Gross</TableHead><TableHead className="text-right">VAT</TableHead><TableHead className="text-right">Net</TableHead><TableHead>Document</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{tx.transaction_type.replace("_", " ")}</Badge></TableCell>
                          <TableCell className="text-sm">{tx.description}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(tx.gross_amount)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(tx.vat_amount)}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(tx.net_amount)}</TableCell>
                          <TableCell>{tx.has_document
                            ? <Badge variant="secondary" className="text-xs bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Attached</Badge>
                            : <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800"><AlertTriangle className="mr-1 h-3 w-3" />Still Due</Badge>
                          }</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3}>Totals</TableCell>
                        <TableCell className="text-right">{formatCurrency(transactions.reduce((s, t) => s + Number(t.gross_amount), 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(transactions.reduce((s, t) => s + Number(t.vat_amount), 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(transactions.reduce((s, t) => s + Number(t.net_amount), 0))}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="periods">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => setShowNewPeriod(true)}><Plus className="mr-1 h-4 w-4" />Create Period</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {periods.length === 0 ? (
                <div className="flex flex-col items-center py-12"><FileText className="mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">No VAT periods created yet</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Period</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Output VAT</TableHead><TableHead className="text-right">Input VAT</TableHead><TableHead className="text-right">Net VAT</TableHead>
                    <TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {periods.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{format(new Date(p.period_start), "dd MMM yyyy")} – {format(new Date(p.period_end), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "finalized" ? "secondary" : "outline"} className={`text-xs ${p.status === "finalized" ? "bg-green-100 text-green-800" : ""}`}>
                            {p.status === "finalized" && <Lock className="mr-1 h-3 w-3" />}{p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(p.output_vat))}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(p.input_vat))}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(p.net_vat))}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExportVatPack(p)}>
                              <Download className="mr-1 h-3 w-3" />Export
                            </Button>
                            {p.status === "draft" && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleFinalizePeriod(p.id)}>
                                <CheckCircle className="mr-1 h-3 w-3" />Finalize
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewPeriod} onOpenChange={setShowNewPeriod}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create VAT Period</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Period Start</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
              <div className="space-y-2"><Label>Period End</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={periodNotes} onChange={(e) => setPeriodNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPeriod(false)}>Cancel</Button>
            <Button onClick={handleCreatePeriod} disabled={!periodStart || !periodEnd}>Create Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VAT;
