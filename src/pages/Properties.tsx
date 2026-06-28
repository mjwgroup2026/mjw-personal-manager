import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Home } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Properties = () => {
  const { selectedEntity } = useEntity();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    if (!selectedEntity) return;
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .eq("is_deleted", false)
      .order("property_name");
    setProperties(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, [selectedEntity]);

  const handleDelete = async (id: string) => {
    await supabase.from("properties").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Property archived" });
    fetchProperties();
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
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-sm text-muted-foreground">{selectedEntity.trading_name || selectedEntity.legal_name}</p>
        </div>
        <Button onClick={() => navigate("/app/properties/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No properties yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Municipality</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Bond</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.property_name}</TableCell>
                    <TableCell className="text-sm">{p.physical_address || "—"}</TableCell>
                    <TableCell className="text-sm">{p.municipality || "—"}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(p.purchase_price ?? 0)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(p.bond_amount ?? 0)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/app/properties/${p.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive property?</AlertDialogTitle>
                              <AlertDialogDescription>This will soft-delete the property and its tenants.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)}>Archive</AlertDialogAction>
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

export default Properties;
