import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const TenantForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<{ id: string; property_name: string }[]>([]);

  const [form, setForm] = useState({
    property_id: "",
    tenant_name: "",
    lease_start: "",
    lease_end: "",
    monthly_rental: "0",
    escalation_percent: "0",
    deposit_amount: "0",
    deposit_held: false,
  });

  useEffect(() => {
    if (!selectedEntity) return;
    supabase.from("properties").select("id, property_name")
      .eq("entity_id", selectedEntity.id).eq("is_deleted", false)
      .order("property_name").then(({ data }) => setProperties(data ?? []));
  }, [selectedEntity]);

  useEffect(() => {
    if (isEditing) {
      supabase.from("tenants").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({
          property_id: data.property_id,
          tenant_name: data.tenant_name,
          lease_start: data.lease_start ?? "",
          lease_end: data.lease_end ?? "",
          monthly_rental: String(data.monthly_rental),
          escalation_percent: String(data.escalation_percent ?? 0),
          deposit_amount: String(data.deposit_amount ?? 0),
          deposit_held: data.deposit_held,
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      property_id: form.property_id,
      tenant_name: form.tenant_name,
      lease_start: form.lease_start || null,
      lease_end: form.lease_end || null,
      monthly_rental: Number(form.monthly_rental),
      escalation_percent: Number(form.escalation_percent),
      deposit_amount: Number(form.deposit_amount),
      deposit_held: form.deposit_held,
    };

    if (isEditing) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Tenant updated" }); navigate("/app/tenants"); }
    } else {
      const { error } = await supabase.from("tenants").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Tenant created" }); navigate("/app/tenants"); }
    }
    setSubmitting(false);
  };

  const u = (f: string, v: string | boolean) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/tenants")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
      </Button>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>{isEditing ? "Edit Tenant" : "New Tenant"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tenant Name *</Label>
                <Input value={form.tenant_name} onChange={(e) => u("tenant_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={(v) => u("property_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Lease Start</Label>
                <Input type="date" value={form.lease_start} onChange={(e) => u("lease_start", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Lease End</Label>
                <Input type="date" value={form.lease_end} onChange={(e) => u("lease_end", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Monthly Rental</Label>
                <Input type="number" step="0.01" value={form.monthly_rental} onChange={(e) => u("monthly_rental", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Escalation (%)</Label>
                <Input type="number" step="0.01" value={form.escalation_percent} onChange={(e) => u("escalation_percent", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deposit Amount</Label>
                <Input type="number" step="0.01" value={form.deposit_amount} onChange={(e) => u("deposit_amount", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.deposit_held} onCheckedChange={(v) => u("deposit_held", v)} />
              <Label>Deposit Held</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : isEditing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/tenants")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantForm;
