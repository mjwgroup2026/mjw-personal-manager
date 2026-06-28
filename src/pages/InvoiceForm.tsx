import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  vat_percentage: number;
  line_total: number;
  sort_order: number;
}

interface ClientForm {
  name: string;
  registration_number: string;
  vat_number: string;
  address: string;
  email: string;
}

const emptyLine = (): LineItem => ({
  description: "",
  quantity: 1,
  unit_price: 0,
  discount: 0,
  vat_percentage: 0,
  line_total: 0,
  sort_order: 0,
});

const InvoiceForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { selectedEntity, refetch: refetchEntity } = useEntity();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [clientForm, setClientForm] = useState<ClientForm>({
    name: "", registration_number: "", vat_number: "", address: "", email: "",
  });

  const [vatApplicable, setVatApplicable] = useState(false);
  const [vatPercentage, setVatPercentage] = useState(15);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Due on receipt");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [status, setStatus] = useState<string>("draft");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [showEditReasonDialog, setShowEditReasonDialog] = useState(false);

  // Fetch clients
  useEffect(() => {
    if (!selectedEntity) return;
    supabase
      .from("invoice_clients")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .order("name")
      .then(({ data }) => setClients(data ?? []));
  }, [selectedEntity]);

  // Fetch existing invoice
  useEffect(() => {
    if (!isEditing || !selectedEntity) return;
    const fetchInvoice = async () => {
      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (!inv) return;

      setClientId(inv.client_id);
      setVatApplicable(inv.vat_applicable);
      setVatPercentage(Number(inv.vat_percentage));
      setIssueDate(inv.issue_date);
      setDueDate(inv.due_date ?? "");
      setPaymentTerms(inv.payment_terms ?? "Due on receipt");
      setNotes(inv.notes ?? "");
      setStatus(inv.status);
      setInvoiceNumber(inv.invoice_number);
      setIsDeleted(inv.is_deleted);

      const { data: lineData } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", id)
        .order("sort_order");
      if (lineData && lineData.length > 0) {
        setLines(lineData.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          discount: Number(l.discount),
          vat_percentage: Number(l.vat_percentage),
          line_total: Number(l.line_total),
          sort_order: l.sort_order,
        })));
      }
    };
    fetchInvoice();
  }, [id, isEditing, selectedEntity]);

  // Calculate line totals
  const recalcLine = (line: LineItem): LineItem => {
    const base = line.quantity * line.unit_price;
    const afterDiscount = base - (base * line.discount / 100);
    const vatAmt = vatApplicable ? afterDiscount * line.vat_percentage / 100 : 0;
    return { ...line, line_total: afterDiscount + vatAmt };
  };

  const updateLine = (idx: number, field: keyof LineItem, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[idx] = recalcLine({ ...updated[idx], [field]: value });
      return updated;
    });
  };

  // When VAT toggle changes, update all lines
  useEffect(() => {
    setLines((prev) =>
      prev.map((l) =>
        recalcLine({ ...l, vat_percentage: vatApplicable ? vatPercentage : 0 })
      )
    );
  }, [vatApplicable, vatPercentage]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const base = l.quantity * l.unit_price;
      return sum + base - (base * l.discount / 100);
    }, 0);
  }, [lines]);

  const vatTotal = useMemo(() => {
    if (!vatApplicable) return 0;
    return lines.reduce((sum, l) => {
      const base = l.quantity * l.unit_price;
      const afterDiscount = base - (base * l.discount / 100);
      return sum + afterDiscount * l.vat_percentage / 100;
    }, 0);
  }, [lines, vatApplicable]);

  const grandTotal = subtotal + vatTotal;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  const generateInvoiceNumber = async () => {
    if (!selectedEntity) return "";
    const prefix = selectedEntity.invoice_prefix || "ENT";
    const year = new Date().getFullYear();
    const nextNum = selectedEntity.next_invoice_number || 1;
    return `${prefix}-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  const saveNewClient = async () => {
    if (!selectedEntity || !user) return;
    const { data, error } = await supabase
      .from("invoice_clients")
      .insert({
        entity_id: selectedEntity.id,
        name: clientForm.name,
        registration_number: clientForm.registration_number || null,
        vat_number: clientForm.vat_number || null,
        address: clientForm.address || null,
        email: clientForm.email || null,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setClients((prev) => [...prev, data]);
    setClientId(data.id);
    setShowNewClient(false);
    setClientForm({ name: "", registration_number: "", vat_number: "", address: "", email: "" });
    toast({ title: "Client saved" });
  };

  const handleSubmit = async () => {
    if (!selectedEntity || !user || !clientId) {
      toast({ title: "Error", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (lines.every((l) => !l.description)) {
      toast({ title: "Error", description: "Add at least one line item.", variant: "destructive" });
      return;
    }

    // If editing an issued invoice, require reason
    if (isEditing && status !== "draft" && !editReason) {
      setShowEditReasonDialog(true);
      return;
    }

    setSubmitting(true);

    if (isEditing) {
      const { error } = await supabase
        .from("invoices")
        .update({
          client_id: clientId,
          vat_applicable: vatApplicable,
          vat_percentage: vatPercentage,
          issue_date: issueDate,
          due_date: dueDate || null,
          payment_terms: paymentTerms,
          notes: notes || null,
          subtotal,
          vat_total: vatTotal,
          grand_total: grandTotal,
          status: status as any,
          updated_by: user.id,
        })
        .eq("id", id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Delete old line items and re-insert
      await supabase.from("invoice_line_items").delete().eq("invoice_id", id!);
      const linePayload = lines
        .filter((l) => l.description)
        .map((l, i) => ({
          invoice_id: id!,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: l.discount,
          vat_percentage: l.vat_percentage,
          line_total: l.line_total,
          sort_order: i,
        }));
      if (linePayload.length > 0) {
        await supabase.from("invoice_line_items").insert(linePayload);
      }
      toast({ title: "Invoice updated" });
    } else {
      const invNum = await generateInvoiceNumber();
      const { data: inv, error } = await supabase
        .from("invoices")
        .insert({
          entity_id: selectedEntity.id,
          client_id: clientId,
          invoice_number: invNum,
          issue_date: issueDate,
          due_date: dueDate || null,
          vat_applicable: vatApplicable,
          vat_percentage: vatPercentage,
          subtotal,
          vat_total: vatTotal,
          grand_total: grandTotal,
          status: "draft" as any,
          notes: notes || null,
          payment_terms: paymentTerms,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Insert line items
      const linePayload = lines
        .filter((l) => l.description)
        .map((l, i) => ({
          invoice_id: inv.id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount: l.discount,
          vat_percentage: l.vat_percentage,
          line_total: l.line_total,
          sort_order: i,
        }));
      if (linePayload.length > 0) {
        await supabase.from("invoice_line_items").insert(linePayload);
      }

      // Increment entity invoice number
      await supabase
        .from("entities")
        .update({ next_invoice_number: (selectedEntity.next_invoice_number || 1) + 1 })
        .eq("id", selectedEntity.id);
      refetchEntity();

      toast({ title: "Invoice created", description: invNum });
    }

    setSubmitting(false);
    navigate("/app/invoices");
  };

  const handleSoftDelete = async () => {
    if (!user || !id) return;
    await supabase
      .from("invoices")
      .update({ is_deleted: true, updated_by: user.id })
      .eq("id", id);
    toast({ title: "Invoice deleted" });
    navigate("/app/invoices");
  };

  const handleRestore = async () => {
    if (!user || !id) return;
    await supabase
      .from("invoices")
      .update({ is_deleted: false, updated_by: user.id })
      .eq("id", id);
    toast({ title: "Invoice restored" });
    setIsDeleted(false);
  };

  const handleCancel = async () => {
    if (!user || !id) return;
    await supabase
      .from("invoices")
      .update({ status: "cancelled" as any, updated_by: user.id })
      .eq("id", id);
    toast({ title: "Invoice cancelled" });
    setStatus("cancelled");
  };

  const handleMarkPaid = async () => {
    if (!user || !id) return;
    await supabase
      .from("invoices")
      .update({ status: "paid" as any, updated_by: user.id })
      .eq("id", id);
    toast({ title: "Invoice marked as paid" });
    setStatus("paid");
  };

  const handleIssue = async () => {
    if (!user || !id || !selectedEntity) return;
    // Update status to issued
    await supabase
      .from("invoices")
      .update({ status: "issued" as any, updated_by: user.id })
      .eq("id", id);

    // Auto-post income transaction to ledger
    const { data: inv } = await supabase.from("invoices").select("*, invoice_clients(name)").eq("id", id).single();
    if (inv) {
      // Check no existing auto-posted transaction for this invoice
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("entity_id", selectedEntity.id)
        .eq("source_type", "invoice")
        .eq("reference_number", inv.invoice_number)
        .eq("is_current", true)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("transactions").insert({
          entity_id: selectedEntity.id,
          transaction_type: "invoice" as any,
          date: inv.issue_date,
          description: `Invoice ${inv.invoice_number} — ${(inv as any).invoice_clients?.name || "Client"}`,
          gross_amount: Number(inv.grand_total),
          vat_amount: Number(inv.vat_total),
          net_amount: Number(inv.subtotal),
          vat_treatment: inv.vat_applicable ? "standard" as any : "none" as any,
          source_type: "invoice",
          reference_number: inv.invoice_number,
          payment_status: "unpaid",
          created_by: user.id,
        });
      }
    }

    toast({ title: "Invoice issued", description: "Income transaction auto-posted to ledger." });
    setStatus("issued");
  };

  const handleDownloadPdf = async () => {
    if (!selectedEntity) return;
    const client = clients.find((c) => c.id === clientId);
    generateInvoicePdf({
      entity: selectedEntity,
      client,
      invoiceNumber,
      issueDate,
      dueDate,
      paymentTerms,
      notes,
      vatApplicable,
      vatPercentage,
      lines,
      subtotal,
      vatTotal,
      grandTotal,
    });
  };

  const isDraft = status === "draft";

  if (!selectedEntity) return null;

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/invoices")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? `Invoice ${invoiceNumber}` : "New Invoice"}
          </h1>
          {isEditing && (
            <p className="text-sm text-muted-foreground capitalize">Status: {status}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && invoiceNumber && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
          {isEditing && isDraft && (
            <Button variant="outline" size="sm" onClick={handleIssue}>Issue</Button>
          )}
          {isEditing && status === "issued" && (
            <Button variant="outline" size="sm" onClick={handleMarkPaid}>Mark Paid</Button>
          )}
          {isEditing && !isDeleted && status !== "cancelled" && (
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          )}
          {isEditing && role === "owner" && !isDeleted && (
            <Button variant="destructive" size="sm" onClick={handleSoftDelete}>Delete</Button>
          )}
          {isEditing && role === "owner" && isDeleted && (
            <Button variant="outline" size="sm" onClick={handleRestore}>Restore</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setShowNewClient(true)}>
                  <Plus className="mr-1 h-4 w-4" /> New
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VAT Toggle */}
          <Card>
            <CardHeader><CardTitle className="text-base">VAT Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={vatApplicable} onCheckedChange={setVatApplicable} id="vat-toggle" disabled={!isDraft && isEditing} />
                <Label htmlFor="vat-toggle">
                  {vatApplicable ? "VAT Registered Entity" : "Non-VAT Entity"}
                </Label>
              </div>
              {vatApplicable && (
                <div className="space-y-2">
                  <Label>VAT %</Label>
                  <Input
                    type="number"
                    value={vatPercentage}
                    onChange={(e) => setVatPercentage(Number(e.target.value))}
                    className="w-24"
                    disabled={!isDraft && isEditing}
                  />
                </div>
              )}
              {!vatApplicable && (
                <p className="text-xs text-muted-foreground">Invoice will state: "Not VAT Registered"</p>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <Plus className="mr-1 h-4 w-4" /> Add Line
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Disc %</TableHead>
                    {vatApplicable && <TableHead>VAT %</TableHead>}
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(i, "description", e.target.value)}
                          placeholder="Description"
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                          className="w-20 text-sm"
                          min={0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.unit_price}
                          onChange={(e) => updateLine(i, "unit_price", Number(e.target.value))}
                          className="w-28 text-sm"
                          min={0}
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.discount}
                          onChange={(e) => updateLine(i, "discount", Number(e.target.value))}
                          className="w-20 text-sm"
                          min={0}
                          max={100}
                        />
                      </TableCell>
                      {vatApplicable && (
                        <TableCell>
                          <Input
                            type="number"
                            value={line.vat_percentage}
                            onChange={(e) => updateLine(i, "vat_percentage", Number(e.target.value))}
                            className="w-20 text-sm"
                            min={0}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(line.line_total)}
                      </TableCell>
                      <TableCell>
                        {lines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setLines((p) => p.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2 text-sm">
                <div className="flex w-64 justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {vatApplicable && (
                  <div className="flex w-64 justify-between">
                    <span className="text-muted-foreground">VAT</span>
                    <span className="font-medium">{formatCurrency(vatTotal)}</span>
                  </div>
                )}
                <div className="flex w-64 justify-between border-t pt-2">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input value={clientForm.registration_number} onChange={(e) => setClientForm((p) => ({ ...p, registration_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>VAT Number</Label>
              <Input value={clientForm.vat_number} onChange={(e) => setClientForm((p) => ({ ...p, vat_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={clientForm.address} onChange={(e) => setClientForm((p) => ({ ...p, address: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClient(false)}>Cancel</Button>
            <Button onClick={saveNewClient} disabled={!clientForm.name}>Save Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reason Dialog */}
      <Dialog open={showEditReasonDialog} onOpenChange={setShowEditReasonDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reason Required</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for editing this issued invoice</Label>
            <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditReasonDialog(false)}>Cancel</Button>
            <Button onClick={() => { setShowEditReasonDialog(false); handleSubmit(); }} disabled={!editReason}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceForm;
