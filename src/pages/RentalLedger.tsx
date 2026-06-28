import { useEffect, useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, startOfMonth } from "date-fns";

const RentalLedger = () => {
  const { selectedEntity } = useEntity();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ property_id: "", tenant_id: "", month: format(startOfMonth(new Date()), "yyyy-MM-dd"), rental_due: "0", rental_received: "0" });

  const fetchData = async () => {
    if (!selectedEntity) return;
    const { data: props } = await supabase.from("properties").select("id, property_name")
      .eq("entity_id", selectedEntity.id).eq("is_deleted", false);
    setProperties(props ?? []);
    if (!props?.length) { setRecords([]); return; }
    const propIds = props.map(p => p.id);
    
    const { data: tData } = await supabase.from("tenants").select("id, tenant_name, property_id")
      .in("property_id", propIds).eq("is_deleted", false);
    setTenants(tData ?? []);

    const { data } = await supabase.from("rental_income").select("*, properties(property_name), tenants(tenant_name)")
      .in("property_id", propIds).order("month", { ascending: false });
    setRecords(data ?? []);
  };

  useEffect(() => { fetchData(); }, [selectedEntity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const arrears = Number(form.rental_due) - Number(form.rental_received);
    const { error } = await supabase.from("rental_income").insert({
      property_id: form.property_id,
      tenant_id: form.tenant_id || null,
      month: form.month,
      rental_due: Number(form.rental_due),
      rental_received: Number(form.rental_received),
      arrears: arrears > 0 ? arrears : 0,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Rental entry recorded" }); setDialogOpen(false); fetchData(); }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  const totalDue = records.reduce((s, r) => s + Number(r.rental_due), 0);
  const totalReceived = records.reduce((s, r) => s + Number(r.rental_received), 0);
  const totalArrears = records.reduce((s, r) => s + Number(r.arrears), 0);

  if (!selectedEntity) {
    return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select an entity.</p></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rental Ledger</h1>
          <p className="text-sm text-muted-foreground">{selectedEntity.trading_name || selectedEntity.legal_name}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Rental Payment</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Property *</Label>
                <Select value={form.property_id} onValueChange={(v) => setForm(p => ({ ...p, property_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm(p => ({ ...p, tenant_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{tenants.filter(t => t.property_id === form.property_id).map(t => <SelectItem key={t.id} value={t.id}>{t.tenant_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Input type="date" value={form.month} onChange={(e) => setForm(p => ({ ...p, month: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rental Due</Label>
                  <Input type="number" step="0.01" value={form.rental_due} onChange={(e) => setForm(p => ({ ...p, rental_due: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Rental Received</Label>
                  <Input type="number" step="0.01" value={form.rental_received} onChange={(e) => setForm(p => ({ ...p, rental_received: e.target.value }))} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Due</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalDue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Received</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Arrears</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalArrears)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Arrears</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No rental records</TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{format(new Date(r.month), "MMM yyyy")}</TableCell>
                  <TableCell className="text-sm">{(r as any).properties?.property_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{(r as any).tenants?.tenant_name ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(r.rental_due)}</TableCell>
                  <TableCell className="text-right text-sm text-green-600">{formatCurrency(r.rental_received)}</TableCell>
                  <TableCell className="text-right text-sm text-red-500">{r.arrears > 0 ? formatCurrency(r.arrears) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalLedger;
