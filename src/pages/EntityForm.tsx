import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { sendSentraWebhook } from "@/lib/sentra-webhook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type VatStatus = Database["public"]["Enums"]["vat_status"];
type EntityType = Database["public"]["Enums"]["entity_type"];

const EntityForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    legal_name: "",
    trading_name: "",
    entity_type: "personal" as EntityType,
    vat_status: "not_registered" as VatStatus,
    vat_number: "",
    vat_filing_frequency: "bi-monthly",
    registration_number: "",
    physical_address: "",
    contact_email: "",
    bank_name: "",
    bank_account_number: "",
    bank_branch_code: "",
    bank_account_type: "",
    invoice_prefix: "ENT",
    invoice_accent_color: "#D4A853",
    invoice_font: "default",
    invoice_layout: "classic",
  });

  useEffect(() => {
    if (isEditing) {
      supabase.from("entities").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            legal_name: data.legal_name,
            trading_name: data.trading_name ?? "",
            entity_type: (data as any).entity_type ?? "personal",
            vat_status: data.vat_status,
            vat_number: data.vat_number ?? "",
            vat_filing_frequency: (data as any).vat_filing_frequency ?? "bi-monthly",
            registration_number: (data as any).registration_number ?? "",
            physical_address: (data as any).physical_address ?? "",
            contact_email: (data as any).contact_email ?? "",
            bank_name: data.bank_name ?? "",
            bank_account_number: data.bank_account_number ?? "",
            bank_branch_code: data.bank_branch_code ?? "",
            bank_account_type: data.bank_account_type ?? "",
            invoice_prefix: data.invoice_prefix,
            invoice_accent_color: (data as any).invoice_accent_color ?? "#D4A853",
            invoice_font: (data as any).invoice_font ?? "default",
            invoice_layout: (data as any).invoice_layout ?? "classic",
          });
        }
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const payload = {
      legal_name: form.legal_name,
      trading_name: form.trading_name || null,
      entity_type: form.entity_type as EntityType,
      vat_status: form.vat_status,
      vat_number: form.vat_number || null,
      vat_filing_frequency: form.vat_filing_frequency || "bi-monthly",
      registration_number: form.registration_number || null,
      physical_address: form.physical_address || null,
      contact_email: form.contact_email || null,
      bank_name: form.bank_name || null,
      bank_account_number: form.bank_account_number || null,
      bank_branch_code: form.bank_branch_code || null,
      bank_account_type: form.bank_account_type || null,
      invoice_prefix: form.invoice_prefix,
      invoice_accent_color: form.invoice_accent_color,
      invoice_font: form.invoice_font,
      invoice_layout: form.invoice_layout,
    };

    if (isEditing) {
      const { error } = await supabase.from("entities").update(payload).eq("id", id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Entity updated" });
        refetch();
        navigate("/app/entities");
      }
    } else {
      const newEntityId = crypto.randomUUID();
      const { error } = await supabase
        .from("entities")
        .insert({ id: newEntityId, ...payload, created_by: user.id });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        sendSentraWebhook("WORKSPACE_CREATED", user.id, "free", 0, newEntityId);
        toast({ title: "Entity created" });
        refetch();
        navigate("/app/entities");
      }
    }
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/entities")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Entities
      </Button>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Entity" : "New Entity"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name *</Label>
                <Input id="legal_name" value={form.legal_name} onChange={(e) => updateField("legal_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trading_name">Trading Name</Label>
                <Input id="trading_name" value={form.trading_name} onChange={(e) => updateField("trading_name", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={form.entity_type} onValueChange={(v) => updateField("entity_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="sole_prop">Sole Proprietor</SelectItem>
                  <SelectItem value="pty_ltd">PTY Ltd</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input id="registration_number" value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => updateField("contact_email", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="physical_address">Physical Address</Label>
              <Textarea id="physical_address" value={form.physical_address} onChange={(e) => updateField("physical_address", e.target.value)} rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>VAT Status</Label>
                <Select value={form.vat_status} onValueChange={(v) => updateField("vat_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_registered">Not Registered</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input id="vat_number" value={form.vat_number} onChange={(e) => updateField("vat_number", e.target.value)} />
              </div>
            </div>

            {(form.vat_status === "registered" || form.vat_status === "pending") && (
              <div className="space-y-2">
                <Label>VAT Filing Frequency</Label>
                <Select value={form.vat_filing_frequency} onValueChange={(v) => updateField("vat_filing_frequency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-monthly">Bi-Monthly</SelectItem>
                    <SelectItem value="four-monthly">Every 4 Months</SelectItem>
                    <SelectItem value="six-monthly">Every 6 Months</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
              <Input id="invoice_prefix" value={form.invoice_prefix} onChange={(e) => updateField("invoice_prefix", e.target.value)} required maxLength={5} />
            </div>

            <h3 className="pt-2 text-sm font-medium text-muted-foreground">Bank Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input id="bank_name" value={form.bank_name} onChange={(e) => updateField("bank_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input id="bank_account_number" value={form.bank_account_number} onChange={(e) => updateField("bank_account_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch_code">Branch Code</Label>
                <Input id="bank_branch_code" value={form.bank_branch_code} onChange={(e) => updateField("bank_branch_code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_type">Account Type</Label>
                <Input id="bank_account_type" value={form.bank_account_type} onChange={(e) => updateField("bank_account_type", e.target.value)} placeholder="e.g. Cheque, Savings" />
              </div>
            </div>

            <h3 className="pt-2 text-sm font-medium text-muted-foreground">Invoice Branding</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invoice_accent_color">Accent Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.invoice_accent_color}
                    onChange={(e) => updateField("invoice_accent_color", e.target.value)}
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.invoice_accent_color}
                    onChange={(e) => updateField("invoice_accent_color", e.target.value)}
                    className="flex-1"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Font Style</Label>
                <Select value={form.invoice_font} onValueChange={(v) => updateField("invoice_font", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Helvetica)</SelectItem>
                    <SelectItem value="serif">Serif (Times)</SelectItem>
                    <SelectItem value="mono">Monospace (Courier)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select value={form.invoice_layout} onValueChange={(v) => updateField("invoice_layout", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update Entity" : "Create Entity"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/entities")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntityForm;
