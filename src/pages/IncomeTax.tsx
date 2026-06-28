import { useEffect, useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Download, RefreshCw, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportCSV, generateDateFilename } from "@/lib/export-utils";
import { format, startOfMonth, addMonths, differenceInMonths } from "date-fns";

const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: `${year}-03-01`, end: `${year + 1}-02-28`, year };
};

const IncomeTax = () => {
  const { selectedEntity } = useEntity();
  const { user } = useAuth();
  const { toast } = useToast();
  const [income, setIncome] = useState(0);
  const [expensesByCode, setExpensesByCode] = useState<{ code: string; name: string; total: number }[]>([]);
  const defaultRange = getCurrentTaxYear();
  const [dateFrom, setDateFrom] = useState(defaultRange.start);
  const [dateTo, setDateTo] = useState(defaultRange.end);
  const [tab, setTab] = useState("summary");
  const [summaries, setSummaries] = useState<any[]>([]);
  const [building, setBuilding] = useState(false);
  const [provManualEstimate, setProvManualEstimate] = useState("");

  const fetchData = () => {
    if (!selectedEntity) return;
    supabase
      .from("transactions")
      .select("transaction_type, net_amount, expense_codes(code, name)")
      .eq("entity_id", selectedEntity.id)
      .eq("is_current", true)
      .gte("date", dateFrom).lte("date", dateTo)
      .then(({ data }) => {
        let inc = 0;
        const codeMap: Record<string, { code: string; name: string; total: number }> = {};
        (data as any[] ?? []).forEach((t) => {
          if (t.transaction_type === "income" || t.transaction_type === "invoice") inc += Number(t.net_amount);
          else if (t.transaction_type === "expense" && t.expense_codes) {
            const key = t.expense_codes.code;
            if (!codeMap[key]) codeMap[key] = { code: key, name: t.expense_codes.name, total: 0 };
            codeMap[key].total += Number(t.net_amount);
          }
        });
        setIncome(inc);
        setExpensesByCode(Object.values(codeMap).sort((a, b) => a.code.localeCompare(b.code)));
      });
  };

  const fetchSummaries = () => {
    if (!selectedEntity) return;
    supabase.from("income_tax_summaries")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .eq("tax_year", `${defaultRange.year}/${defaultRange.year + 1}`)
      .order("month")
      .then(({ data }) => setSummaries(data ?? []));
  };

  useEffect(() => { fetchData(); fetchSummaries(); }, [selectedEntity, dateFrom, dateTo]);

  const buildMonthlySummaries = async () => {
    if (!selectedEntity || !user) return;
    setBuilding(true);
    const taxYearLabel = `${defaultRange.year}/${defaultRange.year + 1}`;
    const startDate = new Date(defaultRange.start);
    const monthCount = 12;

    // Fetch all vehicles for entity
    const { data: vehicles } = await supabase.from("vehicles").select("id, vehicle_type").eq("entity_id", selectedEntity.id).eq("is_deleted", false);
    const vehicleIds = (vehicles ?? []).map(v => v.id);
    const businessUseIds = (vehicles ?? []).filter(v => v.vehicle_type === "business_use").map(v => v.id);
    const rentalIds = (vehicles ?? []).filter(v => v.vehicle_type === "rental").map(v => v.id);

    // Fetch all vehicle claims and rentals for the tax year
    const { data: allClaims } = vehicleIds.length > 0
      ? await supabase.from("vehicle_claims").select("*").in("vehicle_id", businessUseIds.length ? businessUseIds : ["00000000-0000-0000-0000-000000000000"]).gte("month", defaultRange.start).lte("month", defaultRange.end)
      : { data: [] };
    const { data: allRentals } = vehicleIds.length > 0
      ? await supabase.from("vehicle_rentals").select("*").in("vehicle_id", rentalIds.length ? rentalIds : ["00000000-0000-0000-0000-000000000000"]).gte("month", defaultRange.start).lte("month", defaultRange.end)
      : { data: [] };

    for (let i = 0; i < monthCount; i++) {
      const monthDate = addMonths(startDate, i);
      const monthStr = format(monthDate, "yyyy-MM-dd");
      const monthEnd = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), "yyyy-MM-dd");

      const { data: txData } = await supabase
        .from("transactions")
        .select("transaction_type, net_amount, expense_codes(tax_behavior)")
        .eq("entity_id", selectedEntity.id)
        .eq("is_current", true)
        .gte("date", monthStr).lte("date", monthEnd);

      let grossIncome = 0, deductible = 0, disallowed = 0;
      (txData as any[] ?? []).forEach(t => {
        if (t.transaction_type === "income" || t.transaction_type === "invoice") grossIncome += Number(t.net_amount);
        else if (t.transaction_type === "expense") {
          const behavior = t.expense_codes?.tax_behavior || "deductible";
          if (behavior === "deductible") deductible += Number(t.net_amount);
          else disallowed += Number(t.net_amount);
        }
      });

      // Vehicle adjustments for this month
      let vehicleAdj = 0;

      // Business-use claims: deductible = total_costs * (business_km / total_km)
      const monthClaims = (allClaims ?? []).filter(c => c.month === monthStr);
      monthClaims.forEach(c => {
        const totalKm = Number(c.business_km || 0) + Number(c.private_km || 0);
        const bizPct = totalKm > 0 ? Number(c.business_km || 0) / totalKm : 0;
        const totalCosts = [c.fuel, c.maintenance, c.insurance, c.licence, c.tracking, c.tyres, c.finance_interest, c.parking_tolls]
          .reduce((s, v) => s + Number(v || 0), 0);
        vehicleAdj += totalCosts * bizPct;
      });

      // Vehicle rentals: net rental result (income - costs)
      const monthRentals = (allRentals ?? []).filter(r => r.month === monthStr);
      monthRentals.forEach(r => {
        const rentalInc = Number(r.rental_income || 0);
        const rentalCosts = [r.finance_interest, r.insurance, r.repairs, r.maintenance, r.tracking, r.licence, r.tyres, r.other_costs]
          .reduce((s, v) => s + Number(v || 0), 0);
        grossIncome += rentalInc;
        vehicleAdj += rentalCosts; // costs are deductible
      });

      const netTaxable = grossIncome - deductible - vehicleAdj;

      // Upsert
      const existing = summaries.find(s => s.month === monthStr);
      if (existing) {
        await supabase.from("income_tax_summaries").update({
          gross_taxable_income: grossIncome, deductible_expenses: deductible,
          disallowed_expenses: disallowed, vehicle_adjustments: vehicleAdj,
          net_taxable_result: netTaxable, review_status: "draft",
        }).eq("id", existing.id);
      } else {
        await supabase.from("income_tax_summaries").insert({
          entity_id: selectedEntity.id, month: monthStr, tax_year: taxYearLabel,
          gross_taxable_income: grossIncome, deductible_expenses: deductible,
          disallowed_expenses: disallowed, vehicle_adjustments: vehicleAdj,
          net_taxable_result: netTaxable, created_by: user.id, review_status: "draft",
        });
      }
    }

    toast({ title: "Monthly summaries built with vehicle adjustments" });
    fetchSummaries();
    setBuilding(false);
  };

  const resetToTaxYear = () => { setDateFrom(defaultRange.start); setDateTo(defaultRange.end); };
  const totalExpenses = expensesByCode.reduce((s, e) => s + e.total, 0);
  const netProfit = income - totalExpenses;
  const formatCurrency = (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  // Provisional tax calculations
  const ytdIncome = summaries.reduce((s, m) => s + Number(m.gross_taxable_income || 0), 0);
  const ytdExpenses = summaries.reduce((s, m) => s + Number(m.deductible_expenses || 0), 0);
  const ytdNet = ytdIncome - ytdExpenses;
  const monthsElapsed = summaries.filter(s => Number(s.gross_taxable_income || 0) > 0 || Number(s.deductible_expenses || 0) > 0).length || 1;
  const projectedAnnual = (ytdNet / monthsElapsed) * 12;
  const manualEst = provManualEstimate ? parseFloat(provManualEstimate) : null;

  const handleExportSummaries = () => {
    const data = summaries.map(s => ({
      Month: s.month, "Gross Income": Number(s.gross_taxable_income || 0).toFixed(2),
      "Deductible Expenses": Number(s.deductible_expenses || 0).toFixed(2),
      "Disallowed Expenses": Number(s.disallowed_expenses || 0).toFixed(2),
      "Net Taxable": Number(s.net_taxable_result || 0).toFixed(2), Status: s.review_status,
    }));
    exportCSV(data, generateDateFilename("Income_Tax_Summary", selectedEntity?.trading_name || selectedEntity?.legal_name));
    toast({ title: "Exported" });
  };

  if (!selectedEntity) return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select an entity.</p></div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Income Tax</h1>
          <p className="text-sm text-muted-foreground">Tax Year: March {defaultRange.year} – February {defaultRange.year + 1}</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40" /></div>
          <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40" /></div>
          <Button variant="outline" size="sm" onClick={resetToTaxYear} className="h-9"><RotateCcw className="mr-1 h-3 w-3" />Reset</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Income</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(income)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Taxable Profit</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(netProfit)}</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">By SARS Code</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summaries ({summaries.length})</TabsTrigger>
          <TabsTrigger value="provisional">Provisional Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle className="text-base">Expenses by SARS Code</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {expensesByCode.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No expenses recorded</TableCell></TableRow>
                  ) : (<>
                    {expensesByCode.map((ec) => (
                      <TableRow key={ec.code}><TableCell className="font-mono text-sm">{ec.code}</TableCell><TableCell>{ec.name}</TableCell><TableCell className="text-right font-medium">{formatCurrency(ec.total)}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-medium"><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right">{formatCurrency(totalExpenses)}</TableCell></TableRow>
                  </>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="mb-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleExportSummaries} disabled={summaries.length === 0}>
              <Download className="mr-1 h-3 w-3" />Export
            </Button>
            <Button size="sm" onClick={buildMonthlySummaries} disabled={building}>
              <RefreshCw className={`mr-1 h-3 w-3 ${building ? "animate-spin" : ""}`} />{building ? "Building…" : "Build / Refresh Summaries"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {summaries.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Calculator className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No monthly summaries yet. Click "Build / Refresh" to generate.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                     <TableHead>Month</TableHead><TableHead className="text-right">Income</TableHead><TableHead className="text-right">Deductible</TableHead>
                    <TableHead className="text-right">Disallowed</TableHead><TableHead className="text-right">Vehicle Adj.</TableHead><TableHead className="text-right">Net Taxable</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {summaries.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{format(new Date(s.month), "MMM yyyy")}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(s.gross_taxable_income || 0))}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(s.deductible_expenses || 0))}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(s.disallowed_expenses || 0))}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(s.vehicle_adjustments || 0))}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(s.net_taxable_result || 0))}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{s.review_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>YTD Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(ytdIncome)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ytdExpenses)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summaries.reduce((s, m) => s + Number(m.disallowed_expenses || 0), 0))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(summaries.reduce((s, m) => s + Number(m.vehicle_adjustments || 0), 0))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ytdNet)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisional">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">YTD Net Taxable</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(ytdNet)}</div><p className="text-xs text-muted-foreground">{monthsElapsed} month(s) with activity</p></CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Projected Annual</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(projectedAnnual)}</div><p className="text-xs text-muted-foreground">Run-rate extrapolation</p></CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Risk Status</CardTitle></CardHeader>
              <CardContent>
                {projectedAnnual > 0 ? (
                  <Badge className={`text-sm ${projectedAnnual > 500000 ? "bg-red-100 text-red-800" : projectedAnnual > 200000 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                    {projectedAnnual > 500000 ? "High" : projectedAnnual > 200000 ? "Watch" : "Safe"}
                  </Badge>
                ) : <Badge className="text-sm bg-green-100 text-green-800">Safe</Badge>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Manual Estimate Override</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Override Estimated Taxable Income (ZAR)</Label>
                <Input type="number" value={provManualEstimate} onChange={(e) => setProvManualEstimate(e.target.value)} placeholder="Enter manual estimate" className="w-64" />
              </div>
              {manualEst !== null && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="flex justify-between"><span>Manual Estimate:</span><span className="font-medium">{formatCurrency(manualEst)}</span></div>
                  <div className="flex justify-between"><span>1st Provisional (50%):</span><span>{formatCurrency(manualEst * 0.5)}</span></div>
                  <div className="flex justify-between"><span>2nd Provisional (100%):</span><span>{formatCurrency(manualEst)}</span></div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">This is for planning reference only. Please consult your tax practitioner for official provisional tax calculations.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomeTax;
