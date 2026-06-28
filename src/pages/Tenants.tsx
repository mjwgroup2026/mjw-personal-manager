import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "@/contexts/EntityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Tenants = () => {
  const { selectedEntity } = useEntity();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchTenants = async () => {
    if (!selectedEntity) return;
    // Get properties for this entity first
    const { data: props } = await supabase
      .from("properties")
      .select("id, property_name")
      .eq("entity_id", selectedEntity.id)
      .eq("is_deleted", false);
    
    if (!props?.length) { setTenants([]); return; }
    
    const propIds = props.map(p => p.id);
    const { data } = await supabase
      .from("tenants")
      .select("*, properties(property_name)")
      .in("property_id", propIds)
      .eq("is_deleted", false)
      .order("tenant_name");
    
    setTenants(data ?? []);
  };

  useEffect(() => { fetchTenants(); }, [selectedEntity]);

  const handleDelete = async (id: string) => {
    await supabase.from("tenants").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Tenant archived" });
    fetchTenants();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  if (!selectedEntity) {
    return <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select an entity.</p></div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-sm text-muted-foreground">{selectedEntity.trading_name || selectedEntity.legal_name}</p>
        </div>
        <Button onClick={() => navigate("/app/tenants/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No tenants yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead className="text-right">Monthly Rental</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.tenant_name}</TableCell>
                    <TableCell className="text-sm">{(t as any).properties?.property_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {t.lease_start ? format(new Date(t.lease_start), "dd MMM yyyy") : "—"} – {t.lease_end ? format(new Date(t.lease_end), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(t.monthly_rental)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/app/tenants/${t.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive tenant?</AlertDialogTitle>
                              <AlertDialogDescription>This will soft-delete the tenant record.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(t.id)}>Archive</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tenants;
