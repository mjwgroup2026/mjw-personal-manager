import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertTriangle, CheckCircle, History, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const bankFormats = [
  { value: "absa", label: "ABSA" },
  { value: "standard_bank", label: "Standard Bank" },
  { value: "fnb", label: "FNB" },
  { value: "nedbank", label: "Nedbank" },
  { value: "capitec", label: "Capitec" },
  { value: "custom", label: "Custom / Other" },
];

const FIELD_OPTIONS = [
  { value: "__skip__", label: "— Skip —" },
  { value: "date", label: "Transaction Date" },
  { value: "description", label: "Description" },
  { value: "debit", label: "Debit (Expense)" },
  { value: "credit", label: "Credit (Income)" },
  { value: "amount", label: "Amount (+/−)" },
  { value: "balance", label: "Balance" },
  { value: "reference", label: "Reference" },
];

type ImportRow = {
  index: number;
  data: Record<string, string>;
  mappedDate: string | null;
  mappedDescription: string | null;
  mappedAmount: number | null;
  mappedType: "income" | "expense" | null;
  duplicate: boolean;
  selected: boolean;
  status: "pending" | "posted" | "skipped";
};

const CSVImport = () => {
  const { selectedEntity } = useEntity();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bankFormat, setBankFormat] = useState("custom");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "review">("upload");
  const [posting, setPosting] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [tab, setTab] = useState("import");

  // Fetch import history
  useEffect(() => {
    if (!selectedEntity) return;
    supabase
      .from("csv_import_batches")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setBatches(data ?? []));
  }, [selectedEntity]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast({ title: "Empty or invalid file", variant: "destructive" }); return; }

      const hdrs = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      setHeaders(hdrs);

      // Auto-detect column mapping
      const autoMap: Record<string, string> = {};
      hdrs.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes("date")) autoMap[h] = "date";
        else if (lower.includes("description") || lower.includes("narrative")) autoMap[h] = "description";
        else if (lower.includes("debit")) autoMap[h] = "debit";
        else if (lower.includes("credit")) autoMap[h] = "credit";
        else if (lower === "amount") autoMap[h] = "amount";
        else if (lower.includes("balance")) autoMap[h] = "balance";
        else if (lower.includes("ref")) autoMap[h] = "reference";
        else autoMap[h] = "__skip__";
      });
      setColumnMap(autoMap);

      const parsed = lines.slice(1, 501).map((line, i) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        const obj: Record<string, string> = {};
        hdrs.forEach((h, j) => { obj[h] = cols[j] ?? ""; });
        return {
          index: i,
          data: obj,
          mappedDate: null,
          mappedDescription: null,
          mappedAmount: null,
          mappedType: null,
          duplicate: false,
          selected: true,
          status: "pending" as const,
        };
      });
      setRows(parsed);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const applyMapping = async () => {
    if (!selectedEntity) return;
    const dateCol = Object.entries(columnMap).find(([, v]) => v === "date")?.[0];
    const descCol = Object.entries(columnMap).find(([, v]) => v === "description")?.[0];
    const debitCol = Object.entries(columnMap).find(([, v]) => v === "debit")?.[0];
    const creditCol = Object.entries(columnMap).find(([, v]) => v === "credit")?.[0];
    const amountCol = Object.entries(columnMap).find(([, v]) => v === "amount")?.[0];

    if (!dateCol || !descCol) {
      toast({ title: "Map at least Date and Description", variant: "destructive" });
      return;
    }
    if (!debitCol && !creditCol && !amountCol) {
      toast({ title: "Map at least one amount column (Debit, Credit, or Amount)", variant: "destructive" });
      return;
    }

    // Fetch existing transactions for duplicate detection
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("date, description, gross_amount")
      .eq("entity_id", selectedEntity.id)
      .eq("is_current", true);

    const existingHashes = new Set(
      (existingTx ?? []).map((t) => `${t.date}|${t.description}|${Math.abs(Number(t.gross_amount))}`)
    );

    const mapped = rows.map((row) => {
      const rawDate = row.data[dateCol] || "";
      let parsedDate: string | null = null;
      // Try multiple date formats
      const datePatterns = [
        /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ];
      for (const pat of datePatterns) {
        const m = rawDate.match(pat);
        if (m) {
          if (pat === datePatterns[0]) parsedDate = `${m[1]}-${m[2]}-${m[3]}`;
          else parsedDate = `${m[3]}-${m[2]}-${m[1]}`;
          break;
        }
      }
      if (!parsedDate && rawDate) parsedDate = rawDate; // fallback

      const desc = row.data[descCol] || "";
      let amount = 0;
      let type: "income" | "expense" | null = null;

      if (amountCol) {
        const raw = parseFloat(row.data[amountCol]?.replace(/[^-\d.]/g, "") || "0");
        amount = Math.abs(raw);
        type = raw >= 0 ? "income" : "expense";
      } else {
        const debit = debitCol ? parseFloat(row.data[debitCol]?.replace(/[^-\d.]/g, "") || "0") : 0;
        const credit = creditCol ? parseFloat(row.data[creditCol]?.replace(/[^-\d.]/g, "") || "0") : 0;
        if (debit > 0) { amount = debit; type = "expense"; }
        else if (credit > 0) { amount = credit; type = "income"; }
        else if (debit < 0) { amount = Math.abs(debit); type = "income"; }
        else { amount = Math.abs(credit); type = "expense"; }
      }

      const hash = `${parsedDate}|${desc}|${amount}`;
      const isDuplicate = existingHashes.has(hash);

      return {
        ...row,
        mappedDate: parsedDate,
        mappedDescription: desc,
        mappedAmount: amount,
        mappedType: type,
        duplicate: isDuplicate,
        selected: !isDuplicate && amount > 0,
      };
    }).filter(r => r.mappedAmount !== null && r.mappedAmount > 0);

    setRows(mapped);
    setStep("review");
  };

  const handlePost = async () => {
    if (!user || !selectedEntity) return;
    const selected = rows.filter(r => r.selected && r.status === "pending");
    if (selected.length === 0) { toast({ title: "No rows selected", variant: "destructive" }); return; }

    setPosting(true);

    // Create batch
    const { data: batch, error: batchErr } = await supabase
      .from("csv_import_batches")
      .insert({
        entity_id: selectedEntity.id,
        file_name: fileName,
        bank_format: bankFormat,
        row_count: rows.length,
        imported_count: selected.length,
        status: "processing",
        created_by: user.id,
      })
      .select()
      .single();

    if (batchErr || !batch) {
      toast({ title: "Failed to create batch", description: batchErr?.message, variant: "destructive" });
      setPosting(false);
      return;
    }

    // Insert transactions
    let postedCount = 0;
    for (const row of selected) {
      const { error: txErr, data: txData } = await supabase
        .from("transactions")
        .insert({
          entity_id: selectedEntity.id,
          transaction_type: row.mappedType!,
          date: row.mappedDate!,
          description: row.mappedDescription!,
          gross_amount: row.mappedAmount!,
          vat_amount: 0,
          net_amount: row.mappedAmount!,
          vat_treatment: "none",
          source_type: "csv_import",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (!txErr && txData) {
        // Save import row
        await supabase.from("csv_import_rows").insert({
          batch_id: batch.id,
          row_index: row.index,
          raw_data: row.data,
          mapped_date: row.mappedDate,
          mapped_description: row.mappedDescription,
          mapped_amount: row.mappedAmount,
          mapped_type: row.mappedType,
          duplicate_flag: row.duplicate,
          posted_transaction_id: txData.id,
          status: "posted",
        });
        postedCount++;
      }
    }

    // Update batch status
    await supabase
      .from("csv_import_batches")
      .update({ status: "completed", imported_count: postedCount })
      .eq("id", batch.id);

    // Update row states
    setRows(prev => prev.map(r => r.selected ? { ...r, status: "posted" as const } : r));

    // Refresh batches
    const { data: freshBatches } = await supabase
      .from("csv_import_batches")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setBatches(freshBatches ?? []);

    toast({ title: `${postedCount} transactions imported`, description: `Batch: ${fileName}` });
    setPosting(false);
  };

  const duplicateCount = rows.filter(r => r.duplicate).length;
  const selectedCount = rows.filter(r => r.selected && r.status === "pending").length;
  const postedCount = rows.filter(r => r.status === "posted").length;

  if (!selectedEntity) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select an entity first</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">CSV Import</h1>
        <p className="text-sm text-muted-foreground">Upload, map, review, and post bank statement transactions</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="history">History ({batches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          {/* Step 1: Upload */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">1. Upload Statement</CardTitle>
                <CardDescription>Select bank format and upload CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={bankFormat} onValueChange={setBankFormat}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select bank format" /></SelectTrigger>
                  <SelectContent>
                    {bankFormats.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> {fileName || "Choose CSV File"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Import Status</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div><p className="text-2xl font-bold font-mono-num">{rows.length}</p><p className="text-xs text-muted-foreground">Rows</p></div>
                  <div><p className="text-2xl font-bold font-mono-num text-warning">{duplicateCount}</p><p className="text-xs text-muted-foreground">Duplicates</p></div>
                  <div><p className="text-2xl font-bold font-mono-num text-secondary">{selectedCount}</p><p className="text-xs text-muted-foreground">Selected</p></div>
                  <div><p className="text-2xl font-bold font-mono-num text-success">{postedCount}</p><p className="text-xs text-muted-foreground">Posted</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Column Mapping */}
          {step === "map" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">2. Map Columns</CardTitle>
                <CardDescription>Map each CSV column to a transaction field</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                  {headers.map((h) => (
                    <div key={h} className="space-y-1">
                      <Label className="text-xs font-mono truncate block">{h}</Label>
                      <Select value={columnMap[h] || "__skip__"} onValueChange={(v) => setColumnMap(prev => ({ ...prev, [h]: v }))}>
                        <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <Button onClick={applyMapping}>
                  <ArrowRight className="mr-2 h-4 w-4" /> Apply Mapping & Detect Duplicates
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Post */}
          {step === "review" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">3. Review & Post</CardTitle>
                  <CardDescription>Select rows to import into transactions</CardDescription>
                </div>
                <Button onClick={handlePost} disabled={posting || selectedCount === 0}>
                  {posting ? "Posting…" : `Post ${selectedCount} Transactions`}
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={rows.filter(r => r.status === "pending").every(r => r.selected)}
                          onCheckedChange={(c) => setRows(prev => prev.map(r => r.status === "pending" ? { ...r, selected: c === true } : r))}
                        />
                      </TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 100).map((r) => (
                      <TableRow key={r.index} className={r.duplicate ? "bg-warning/5" : r.status === "posted" ? "bg-success/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={r.selected}
                            disabled={r.status === "posted"}
                            onCheckedChange={(c) => setRows(prev => prev.map(row => row.index === r.index ? { ...row, selected: c === true } : row))}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{r.mappedDate || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{r.mappedDescription || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] ${r.mappedType === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {r.mappedType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          R {r.mappedAmount?.toFixed(2) ?? "0.00"}
                        </TableCell>
                        <TableCell>
                          {r.status === "posted" ? (
                            <Badge className="text-[10px] bg-success/20 text-success border-0"><CheckCircle className="mr-1 h-3 w-3" />Posted</Badge>
                          ) : r.duplicate ? (
                            <Badge variant="outline" className="text-[10px] text-warning border-warning/30"><AlertTriangle className="mr-1 h-3 w-3" />Duplicate</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 100 && <p className="text-xs text-center text-muted-foreground py-2">Showing first 100 of {rows.length} rows</p>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-sm">Import History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {batches.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <History className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No imports yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">File</TableHead>
                      <TableHead className="text-xs">Format</TableHead>
                      <TableHead className="text-xs text-right">Rows</TableHead>
                      <TableHead className="text-xs text-right">Imported</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs">{format(new Date(b.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{b.file_name}</TableCell>
                        <TableCell className="text-xs">{b.bank_format}</TableCell>
                        <TableCell className="text-xs text-right">{b.row_count}</TableCell>
                        <TableCell className="text-xs text-right">{b.imported_count}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === "completed" ? "secondary" : "outline"} className="text-[10px]">{b.status}</Badge>
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
    </div>
  );
};

export default CSVImport;
