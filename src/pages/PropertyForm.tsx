import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const PropertyForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    property_name: "",
    physical_address: "",
    municipality: "",
    rates_account_number: "",
    purchase_price: "0",
    purchase_date: "",
    bond_amount: "0",
    bond_interest_rate: "0",
    notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      supabase.from("properties").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            property_name: data.property_name,
            physical_address: data.physical_address ?? "",
            municipality: data.municipality ?? "",
            rates_account_number: data.rates_account_number ?? "",
            purchase_price: String(data.purchase_price ?? 0),
            purchase_date: data.purchase_date ?? "",
            bond_amount: String(data.bond_amount ?? 0),
            bond_interest_rate: String(data.bond_interest_rate ?? 0),
            notes: data.notes ?? "",
          });
        }
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntity) return;
    setSubmitting(true);

    const payload = {
      property_name: form.property_name,
      physical_address: form.physical_address || null,
      municipality: form.municipality || null,
      rates_account_number: form.rates_account_number || null,
      purchase_price: Number(form.purchase_price) || 0,
      purchase_date: form.purchase_date || null,
      bond_amount: Number(form.bond_amount) || 0,
      bond_interest_rate: Number(form.bond_interest_rate) || 0,
      notes: form.notes || null,
    };

    if (isEditing) {
      const { error } = await supabase.from("properties").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Property updated" }); navigate("/app/properties"); }
    } else {
      const { error } = await supabase.from("properties").insert({ ...payload, entity_id: selectedEntity.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Property created" }); navigate("/app/properties"); }
    }
    setSubmitting(false);
  };

  const u = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/app/properties")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
      </Button>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>{isEditing ? "Edit Property" : "New Property"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Property Name *</Label>
                <Input value={form.property_name} onChange={(e) => u("property_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Municipality</Label>
                <Input value={form.municipality} onChange={(e) => u("municipality", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Textarea value={form.physical_address} onChange={(e) => u("physical_address", e.target.value)} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rates Account Number</Label>
                <Input value={form.rates_account_number} onChange={(e) => u("rates_account_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchase_date} onChange={(e) => u("purchase_date", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => u("purchase_price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bond Amount</Label>
                <Input type="number" step="0.01" value={form.bond_amount} onChange={(e) => u("bond_amount", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bond Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={form.bond_interest_rate} onChange={(e) => u("bond_interest_rate", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => u("notes", e.target.value)} rows={3} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : isEditing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/properties")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyForm;
