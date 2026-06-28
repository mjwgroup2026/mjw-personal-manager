import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const VehicleForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    description: "", registration_number: "", make: "", model: "", year: "",
    vehicle_type: "business_use", purchase_price: "", purchase_date: "", finance_amount: "",
  });

  useEffect(() => {
    if (isEditing) {
      supabase.from("vehicles").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({
          description: data.description, registration_number: data.registration_number ?? "",
          make: data.make ?? "", model: data.model ?? "", year: data.year ? String(data.year) : "",
          vehicle_type: data.vehicle_type, purchase_price: data.purchase_price ? String(data.purchase_price) : "",
          purchase_date: data.purchase_date ?? "", finance_amount: data.finance_amount ? String(data.finance_amount) : "",
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEntity) return;
    setSubmitting(true);
    const payload = {
      description: form.description,
      registration_number: form.registration_number || null,
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      vehicle_type: form.vehicle_type,
      purchase_price: parseFloat(form.purchase_price) || 0,
      purchase_date: form.purchase_date || null,
      finance_amount: parseFloat(form.finance_amount) || 0,
    };
    if (isEditing) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Vehicle updated" }); navigate("/app/vehicles"); }
    } else {
      const { error } = await supabase.from("vehicles").insert({ ...payload, entity_id: selectedEntity.id, created_by: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Vehicle added" }); navigate("/app/vehicles"); }
    }
    setSubmitting(false);
  };

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 md:p-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/app/vehicles")}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-lg">{isEditing ? "Edit Vehicle" : "Add Vehicle"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5"><Label>Description *</Label><Input value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="e.g. 2022 Toyota Hilux" required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Registration</Label><Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => update("vehicle_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_use">Business Use</SelectItem>
                    <SelectItem value="rental">Rental Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Make</Label><Input value={form.make} onChange={(e) => update("make", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Model</Label><Input value={form.model} onChange={(e) => update("model", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Purchase Price (ZAR)</Label><Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => update("purchase_price", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Finance Amount (ZAR)</Label><Input type="number" step="0.01" value={form.finance_amount} onChange={(e) => update("finance_amount", e.target.value)} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : isEditing ? "Update" : "Add Vehicle"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/vehicles")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleForm;
