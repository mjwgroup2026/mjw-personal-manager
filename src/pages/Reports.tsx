import { useState, useEffect } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Receipt, Calculator, Car, ClipboardList, Download, BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportCSV, exportXLSX, exportPDF, generateDateFilename } from "@/lib/export-utils";
import { format } from "date-fns";

const Reports = () => {
  const { selectedEntity } = useEntity();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-03-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year + 1}-02-28`;
  });
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [exporting, setExporting] = useState<string | null>(null);

  const entityName = selectedEntity?.trading_name || selectedEntity?.legal_name || "";

  const exportData = (data: Record<string, any>[], title: string, headers?: string[]) => {
    const filename = generateDateFilename(title.replace(/\s/g, "_"), entityName, dateFrom, dateTo);
    if (data.length === 0) { toast({ title: "No data to export", variant: "destructive" }); return; }
    if (exportFormat === "csv") exportCSV(data, filename);
    else if (exportFormat === "xlsx") exportXLSX(data, filename);
    else if (exportFormat === "pdf" && headers) {
      const rows = data.map(r => headers.map(h => String(r[h] ?? "")));
      exportPDF(title, headers, rows, filename, entityName);
    } else exportCSV(data, filename);
  };

  const handleExport = async (reportType: string) => {
    if (!selectedEntity) return;
    setExporting(reportType);

    try {
      switch (reportType) {
        case "transactions": {
          const { data } = await supabase
            .from("transactions")
            .select("date, transaction_type, description, sub_description, gross_amount, vat_amount, net_amount, vat_treatment, source_type, payment_status, reference_number")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .gte("date", dateFrom).lte("date", dateTo)
            .order("date", { ascending: true });
          const formatted = (data ?? []).map(t => ({
            Date: t.date, Type: t.transaction_type, Description: t.description,
            "Sub-Description": t.sub_description || "", Gross: Number(t.gross_amount).toFixed(2),
            VAT: Number(t.vat_amount).toFixed(2), Net: Number(t.net_amount).toFixed(2),
            "VAT Treatment": t.vat_treatment, Source: t.source_type, Status: t.payment_status,
            Reference: t.reference_number || "",
          }));
          exportData(formatted, "Transaction_Report", ["Date", "Type", "Description", "Sub-Description", "Gross", "VAT", "Net", "VAT Treatment", "Source", "Status", "Reference"]);
          break;
        }
        case "invoices": {
          const { data } = await supabase
            .from("invoices")
            .select("invoice_number, issue_date, due_date, status, subtotal, vat_total, grand_total, invoice_clients(name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_deleted", false)
            .order("issue_date", { ascending: false });
          const formatted = (data ?? []).map((i: any) => ({
            "Invoice #": i.invoice_number, Date: i.issue_date, Due: i.due_date || "",
            Client: i.invoice_clients?.name || "", Status: i.status,
            Subtotal: Number(i.subtotal).toFixed(2), VAT: Number(i.vat_total).toFixed(2),
            Total: Number(i.grand_total).toFixed(2),
          }));
          exportData(formatted, "Invoice_Report", ["Invoice #", "Date", "Due", "Client", "Status", "Subtotal", "VAT", "Total"]);
          break;
        }
        case "supplier_summary": {
          const { data } = await supabase
            .from("transactions")
            .select("gross_amount, net_amount, vat_amount, suppliers(name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .eq("transaction_type", "expense")
            .gte("date", dateFrom).lte("date", dateTo);
          const grouped: Record<string, { name: string; gross: number; vat: number; net: number }> = {};
          (data as any[] ?? []).forEach(t => {
            const name = t.suppliers?.name || "Unlinked";
            if (!grouped[name]) grouped[name] = { name, gross: 0, vat: 0, net: 0 };
            grouped[name].gross += Number(t.gross_amount);
            grouped[name].vat += Number(t.vat_amount);
            grouped[name].net += Number(t.net_amount);
          });
          const formatted = Object.values(grouped).map(g => ({
            Supplier: g.name, Gross: g.gross.toFixed(2), VAT: g.vat.toFixed(2), Net: g.net.toFixed(2),
          }));
          exportData(formatted, "Supplier_Expense_Summary", ["Supplier", "Gross", "VAT", "Net"]);
          break;
        }
        case "customer_summary": {
          const { data } = await supabase
            .from("transactions")
            .select("gross_amount, net_amount, vat_amount, customers(name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .in("transaction_type", ["income", "invoice"])
            .gte("date", dateFrom).lte("date", dateTo);
          const grouped: Record<string, { name: string; gross: number; vat: number; net: number }> = {};
          (data as any[] ?? []).forEach(t => {
            const name = (t as any).customers?.name || "Unlinked";
            if (!grouped[name]) grouped[name] = { name, gross: 0, vat: 0, net: 0 };
            grouped[name].gross += Number(t.gross_amount);
            grouped[name].vat += Number(t.vat_amount);
            grouped[name].net += Number(t.net_amount);
          });
          const formatted = Object.values(grouped).map(g => ({
            Customer: g.name, Gross: g.gross.toFixed(2), VAT: g.vat.toFixed(2), Net: g.net.toFixed(2),
          }));
          exportData(formatted, "Customer_Income_Summary", ["Customer", "Gross", "VAT", "Net"]);
          break;
        }
        case "vat_summary": {
          const { data } = await supabase
            .from("transactions")
            .select("date, transaction_type, description, gross_amount, vat_amount, net_amount")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .eq("vat_treatment", "standard")
            .gte("date", dateFrom).lte("date", dateTo)
            .order("date");
          const formatted = (data ?? []).map(t => ({
            Date: t.date, Type: t.transaction_type, Description: t.description,
            Gross: Number(t.gross_amount).toFixed(2), VAT: Number(t.vat_amount).toFixed(2),
            Net: Number(t.net_amount).toFixed(2),
          }));
          exportData(formatted, "VAT_Summary", ["Date", "Type", "Description", "Gross", "VAT", "Net"]);
          break;
        }
        case "vat_schedule": {
          const { data } = await supabase
            .from("transactions")
            .select("date, transaction_type, description, gross_amount, vat_amount, net_amount, vat_treatment, expense_codes(code, name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .eq("vat_treatment", "standard")
            .gte("date", dateFrom).lte("date", dateTo)
            .order("date");
          const formatted = (data as any[] ?? []).map(t => ({
            Date: t.date, Type: t.transaction_type, Description: t.description,
            "Expense Code": t.expense_codes?.code || "", Category: t.expense_codes?.name || "",
            Gross: Number(t.gross_amount).toFixed(2), VAT: Number(t.vat_amount).toFixed(2),
            Net: Number(t.net_amount).toFixed(2),
          }));
          exportData(formatted, "VAT_Supporting_Schedule", ["Date", "Type", "Description", "Expense Code", "Category", "Gross", "VAT", "Net"]);
          break;
        }
        case "tax_monthly": {
          const { data } = await supabase
            .from("transactions")
            .select("date, transaction_type, net_amount, expense_codes(code, name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .gte("date", dateFrom).lte("date", dateTo)
            .order("date");
          const months: Record<string, { month: string; income: number; expenses: number; net: number }> = {};
          (data as any[] ?? []).forEach(t => {
            const m = t.date.substring(0, 7);
            if (!months[m]) months[m] = { month: m, income: 0, expenses: 0, net: 0 };
            if (t.transaction_type === "income" || t.transaction_type === "invoice") months[m].income += Number(t.net_amount);
            else if (t.transaction_type === "expense") months[m].expenses += Number(t.net_amount);
          });
          const formatted = Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
            Month: m.month, Income: m.income.toFixed(2), Expenses: m.expenses.toFixed(2),
            "Net Profit": (m.income - m.expenses).toFixed(2),
          }));
          exportData(formatted, "Income_Tax_Monthly", ["Month", "Income", "Expenses", "Net Profit"]);
          break;
        }
        case "tax_year": {
          const { data } = await supabase
            .from("transactions")
            .select("transaction_type, net_amount, expense_codes(code, name)")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .gte("date", dateFrom).lte("date", dateTo);
          let income = 0;
          const codes: Record<string, { code: string; name: string; total: number }> = {};
          (data as any[] ?? []).forEach(t => {
            if (t.transaction_type === "income" || t.transaction_type === "invoice") income += Number(t.net_amount);
            else if (t.transaction_type === "expense" && t.expense_codes) {
              const k = t.expense_codes.code;
              if (!codes[k]) codes[k] = { code: k, name: t.expense_codes.name, total: 0 };
              codes[k].total += Number(t.net_amount);
            }
          });
          const totalExp = Object.values(codes).reduce((s, c) => s + c.total, 0);
          const formatted = [
            { Item: "Total Income", Amount: income.toFixed(2) },
            ...Object.values(codes).sort((a, b) => a.code.localeCompare(b.code)).map(c => ({
              Item: `${c.code} - ${c.name}`, Amount: c.total.toFixed(2),
            })),
            { Item: "Total Expenses", Amount: totalExp.toFixed(2) },
            { Item: "Net Taxable Profit", Amount: (income - totalExp).toFixed(2) },
          ];
          exportData(formatted, "Tax_Year_Summary", ["Item", "Amount"]);
          break;
        }
        case "vehicle_claims": {
          const { data } = await supabase
            .from("vehicle_claims")
            .select("*, vehicles(description, registration_number)")
            .eq("vehicles.entity_id", selectedEntity.id)
            .gte("month", dateFrom).lte("month", dateTo);
          const formatted = (data as any[] ?? []).map(c => ({
            Vehicle: c.vehicles?.description || "", Registration: c.vehicles?.registration_number || "",
            Month: c.month, "Opening Odo": c.opening_odo, "Closing Odo": c.closing_odo,
            "Business KM": c.business_km, "Private KM": c.private_km,
            Fuel: Number(c.fuel || 0).toFixed(2), Maintenance: Number(c.maintenance || 0).toFixed(2),
            Insurance: Number(c.insurance || 0).toFixed(2),
          }));
          exportData(formatted, "Vehicle_Claim_Summary", ["Vehicle", "Registration", "Month", "Opening Odo", "Closing Odo", "Business KM", "Private KM", "Fuel", "Maintenance", "Insurance"]);
          break;
        }
        case "vehicle_rentals": {
          const { data } = await supabase
            .from("vehicle_rentals")
            .select("*, vehicles(description, registration_number)")
            .eq("vehicles.entity_id", selectedEntity.id)
            .gte("month", dateFrom).lte("month", dateTo);
          const formatted = (data as any[] ?? []).map(r => ({
            Vehicle: (r as any).vehicles?.description || "", Month: r.month,
            Income: Number(r.rental_income || 0).toFixed(2),
            Interest: Number(r.finance_interest || 0).toFixed(2),
            Insurance: Number(r.insurance || 0).toFixed(2),
            Repairs: Number(r.repairs || 0).toFixed(2),
            Maintenance: Number(r.maintenance || 0).toFixed(2),
            Other: Number(r.other_costs || 0).toFixed(2),
          }));
          exportData(formatted, "Vehicle_Rental_Summary", ["Vehicle", "Month", "Income", "Interest", "Insurance", "Repairs", "Maintenance", "Other"]);
          break;
        }
        case "audit_log": {
          const { data } = await supabase
            .from("audit_log")
            .select("created_at, table_name, action, reason, record_id")
            .order("created_at", { ascending: false })
            .limit(500);
          const formatted = (data ?? []).map(e => ({
            Timestamp: format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
            Table: e.table_name, Action: e.action, Reason: e.reason || "",
            "Record ID": e.record_id,
          }));
          exportData(formatted, "Audit_Log", ["Timestamp", "Table", "Action", "Reason", "Record ID"]);
          break;
        }
        case "doc_completeness": {
          const { data: txData } = await supabase
            .from("transactions")
            .select("id, date, description, transaction_type, gross_amount")
            .eq("entity_id", selectedEntity.id)
            .eq("is_current", true)
            .eq("vat_treatment", "standard")
            .gte("date", dateFrom).lte("date", dateTo);
          const txIds = (txData ?? []).map(t => t.id);
          let docMap: Record<string, boolean> = {};
          if (txIds.length > 0) {
            const { data: docs } = await supabase
              .from("documents")
              .select("transaction_id")
              .in("transaction_id", txIds)
              .eq("is_deleted", false);
            (docs ?? []).forEach((d: any) => { if (d.transaction_id) docMap[d.transaction_id] = true; });
          }
          const formatted = (txData ?? []).map(t => ({
            Date: t.date, Type: t.transaction_type, Description: t.description,
            Gross: Number(t.gross_amount).toFixed(2),
            "Document Status": docMap[t.id] ? "Attached" : "MISSING",
          }));
          exportData(formatted, "Document_Completeness", ["Date", "Type", "Description", "Gross", "Document Status"]);
          break;
        }
      }
      toast({ title: "Export complete" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
    setExporting(null);
  };

  const reports = [
    { key: "transactions", icon: FileText, title: "Transaction List", desc: "Full transaction report with filters" },
    { key: "invoices", icon: Receipt, title: "Invoice List", desc: "All issued invoices with status" },
    { key: "supplier_summary", icon: BarChart3, title: "Supplier Expense Summary", desc: "Expenses grouped by supplier" },
    { key: "customer_summary", icon: BarChart3, title: "Customer Income Summary", desc: "Income grouped by customer" },
    { key: "vat_summary", icon: Receipt, title: "VAT Summary by Period", desc: "Input/output VAT per period" },
    { key: "vat_schedule", icon: Receipt, title: "VAT Supporting Schedule", desc: "Detailed VAT transaction listing" },
    { key: "tax_monthly", icon: Calculator, title: "Income Tax Monthly Summary", desc: "Monthly tax-basis results" },
    { key: "tax_year", icon: Calculator, title: "Tax-Year Summary", desc: "Annual tax position for March–February" },
    { key: "vehicle_claims", icon: Car, title: "Vehicle Claim Summary", desc: "Business-use vehicle deductions" },
    { key: "vehicle_rentals", icon: Car, title: "Vehicle Rental Summary", desc: "Rental income and expenses" },
    { key: "audit_log", icon: ClipboardList, title: "Audit Log Review", desc: "All recorded changes and reasons" },
    { key: "doc_completeness", icon: FileText, title: "Document Completeness", desc: "Missing document flags" },
  ];

  if (!selectedEntity) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select an entity first</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export accounting reports for {entityName}</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ key, icon: Icon, title, desc }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <Icon className="h-4 w-4 text-secondary" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={exporting === key}
                  onClick={() => handleExport(key)}
                >
                  <Download className="mr-1 h-3 w-3" /> {exporting === key ? "…" : "Export"}
                </Button>
              </div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <CardDescription className="text-xs">{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
