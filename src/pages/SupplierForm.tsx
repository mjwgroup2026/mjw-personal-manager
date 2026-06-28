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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const SupplierForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", trading_name: "", registration_number: "", vat_number: "",
    email: "", phone: "", address: "", notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      supabase.from("suppliers").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({
          name: data.name, trading_name: data.trading_name ?? "", registration_number: data.registration_number ?? "",
          vat_number: data.vat_number ?? "", email: data.email ?? "", phone: data.phone ?? "",
          address: data.address ?? "", notes: data.notes ?? "",
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEntity) return;
    setSubmitting(true);
    const payload = {
      ...form, trading_name: form.trading_name || null, registration_number: form.registration_number || null,
      vat_number: form.vat_number || null, email: form.email || null, phone: form.phone || null,
      address: form.address || null, notes: form.notes || null,
    };
    if (isEditing) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Supplier updated" }); navigate("/app/suppliers"); }
    } else {
      const { error } = await supabase.from("suppliers").insert({ ...payload, entity_id: selectedEntity.id, created_by: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Supplier created" }); navigate("/app/suppliers"); }
    }
    setSubmitting(false);
  };

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 md:p-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/app/suppliers")}><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back</Button>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-lg">{isEditing ? "Edit Supplier" : "New Supplier"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Trading Name</Label><Input value={form.trading_name} onChange={(e) => update("trading_name", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Registration Number</Label><Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>VAT Number</Label><Input value={form.vat_number} onChange={(e) => update("vat_number", e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Textarea value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : isEditing ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/app/suppliers")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierForm;
