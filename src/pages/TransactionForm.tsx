import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { isMonthLocked } from "@/lib/period-lock-utils";
import DocumentPicker from "@/components/DocumentPicker";
import { useSubscriptionGuard } from "@/components/SubscriptionGate";
import type { Database, Tables } from "@/integrations/supabase/types";

type TransactionType = Database["public"]["Enums"]["transaction_type"];
type VatTreatment = Database["public"]["Enums"]["vat_treatment"];
type ExpenseCode = Tables<"expense_codes">;

const TransactionForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [expenseCodes, setExpenseCodes] = useState<ExpenseCode[]>([]);
  const [editReason, setEditReason] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const { guardCreate, guardEdit } = useSubscriptionGuard();

  const [form, setForm] = useState({
    transaction_type: "expense" as TransactionType,
    date: new Date().toISOString().split("T")[0],
    description: "",
    sub_description: "",
    gross_amount: "",
    vat_treatment: "none" as VatTreatment,
    expense_code_id: "",
    supplier_id: "",
    customer_id: "",
    reference_number: "",
  });

  useEffect(() => {
    supabase.from("expense_codes").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setExpenseCodes(data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!selectedEntity) return;
    supabase.from("suppliers").select("id, name").eq("entity_id", selectedEntity.id).eq("is_deleted", false).order("name").then(({ data }) => setSuppliers(data ?? []));
    supabase.from("customers").select("id, name").eq("entity_id", selectedEntity.id).eq("is_deleted", false).order("name").then(({ data }) => setCustomers(data ?? []));
  }, [selectedEntity]);

  useEffect(() => {
    if (isEditing) {
      supabase.from("transactions").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            transaction_type: data.transaction_type,
            date: data.date,
            description: data.description,
            sub_description: data.sub_description ?? "",
            gross_amount: String(data.gross_amount),
            vat_treatment: data.vat_treatment,
            expense_code_id: data.expense_code_id ?? "",
            supplier_id: data.supplier_id ?? "",
            customer_id: data.customer_id ?? "",
            reference_number: data.reference_number ?? "",
          });
        }
      });
    }
  }, [id, isEditing]);

  // Check period lock when date changes
  useEffect(() => {
    if (!selectedEntity || !form.date) return;
    isMonthLocked(selectedEntity.id, form.date).then(setPeriodLocked);
  }, [selectedEntity, form.date]);

  const calculateAmounts = (gross: number, vatTreatment: VatTreatment) => {
    if (vatTreatment === "standard") {
      const vat = gross * 15 / 115;
      return { gross_amount: gross, vat_amount: Math.round(vat * 100) / 100, net_amount: Math.round((gross - vat) * 100) / 100 };
    }
    return { gross_amount: gross, vat_amount: 0, net_amount: gross };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEntity) return;

    if (periodLocked) {
      toast({ title: "Period is locked", description: "This month has been locked. Transactions cannot be created or edited in locked periods.", variant: "destructive" });
      return;
    }

    const subBlock = isEditing ? guardEdit() : guardCreate();
    if (subBlock) {
      toast({ title: "Action restricted", description: subBlock, variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const gross = parseFloat(form.gross_amount) || 0;
    const amounts = calculateAmounts(gross, form.vat_treatment);

    if (isEditing) {
      if (!editReason.trim()) {
        toast({ title: "Edit reason required", description: "Please provide a reason for this edit.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      await supabase.from("transactions").update({ is_current: false }).eq("id", id);
      const { data: oldTx } = await supabase.from("transactions").select("version").eq("id", id).single();

      const { error } = await supabase.from("transactions").insert({
        entity_id: selectedEntity.id,
        transaction_type: form.transaction_type,
        date: form.date,
        description: form.description,
        sub_description: form.sub_description || null,
        ...amounts,
        vat_treatment: form.vat_treatment,
        expense_code_id: form.expense_code_id || null,
        supplier_id: form.supplier_id || null,
        customer_id: form.customer_id || null,
        reference_number: form.reference_number || null,
        document_id: documentId,
        created_by: user.id,
        modified_by: user.id,
        parent_transaction_id: id,
        version: (oldTx?.version ?? 1) + 1,
        edit_reason: editReason,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Transaction updated (new version created)" });
        navigate("/app/transactions");
      }
    } else {
      const { error } = await supabase.from("transactions").insert({
        entity_id: selectedEntity.id,
        transaction_type: form.transaction_type,
        date: form.date,
        description: form.description,
        sub_description: form.sub_description || null,
        ...amounts,
        vat_treatment: form.vat_treatment,
        expense_code_id: form.expense_code_id || null,
        supplier_id: form.supplier_id || null,
        customer_id: form.customer_id || null,
        reference_number: form.reference_number || null,
        document_id: documentId,
        created_by: user.id,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Transaction created" });
        navigate("/app/transactions");
      }
    }
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const grossNum = parseFloat(form.gross_amount) || 0;
  const preview = calculateAmounts(grossNum, form.vat_treatment);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/transactions")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Transactions
      </Button>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Transaction" : "New Transaction"}</CardTitle>
        </CardHeader>
        <CardContent>
          {periodLocked && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Period Locked</p>
                <p className="text-xs text-muted-foreground">This month is locked. Transactions cannot be created or modified.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.transaction_type} onValueChange={(v) => updateField("transaction_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="vat_adjustment">VAT Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" value={form.description} onChange={(e) => updateField("description", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_description">Sub-description</Label>
              <Input id="sub_description" value={form.sub_description} onChange={(e) => updateField("sub_description", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input id="reference_number" value={form.reference_number} onChange={(e) => updateField("reference_number", e.target.value)} placeholder="e.g. INV-001, PO-123" />
            </div>

            {(form.transaction_type === "expense" || form.transaction_type === "vat_adjustment") && (
              <>
                <div className="space-y-2">
                  <Label>Expense Code *</Label>
                  <Select value={form.expense_code_id} onValueChange={(v) => updateField("expense_code_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select expense code" /></SelectTrigger>
                    <SelectContent>
                      {expenseCodes.map((ec) => (
                        <SelectItem key={ec.id} value={ec.id}>
                          {ec.code} — {ec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => updateField("supplier_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Select supplier (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— None —</SelectItem>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(form.transaction_type === "income" || form.transaction_type === "invoice") && (
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={form.customer_id} onValueChange={(v) => updateField("customer_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select customer (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gross_amount">Gross Amount (ZAR) *</Label>
                <Input id="gross_amount" type="number" step="0.01" min="0" value={form.gross_amount} onChange={(e) => updateField("gross_amount", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>VAT Treatment</Label>
                <Select value={form.vat_treatment} onValueChange={(v) => updateField("vat_treatment", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No VAT</SelectItem>
                    <SelectItem value="standard">Standard (15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex justify-between"><span>Gross:</span><span>{formatCurrency(preview.gross_amount)}</span></div>
              <div className="flex justify-between"><span>VAT:</span><span>{formatCurrency(preview.vat_amount)}</span></div>
              <div className="flex justify-between font-medium"><span>Net:</span><span>{formatCurrency(preview.net_amount)}</span></div>
            </div>

            {selectedEntity && (
              <DocumentPicker entityId={selectedEntity.id} documentId={documentId} onChange={setDocumentId} />
            )}

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="edit_reason">Reason for Edit *</Label>
                <Textarea id="edit_reason" value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Explain why this transaction is being modified..." required />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting || periodLocked}>
                {submitting ? "Saving..." : isEditing ? "Save New Version" : "Create Transaction"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/transactions")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionForm;
