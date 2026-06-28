import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Car } from "lucide-react";

const Vehicles = () => {
  const { selectedEntity } = useEntity();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEntity) return;
    setLoading(true);
    supabase.from("vehicles").select("*").eq("entity_id", selectedEntity.id).eq("is_deleted", false).order("description")
      .then(({ data }) => { setVehicles(data ?? []); setLoading(false); });
  }, [selectedEntity]);

  if (!selectedEntity) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select an entity first</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Business-use claims and rental income tracking</p>
        </div>
        <Button size="sm" onClick={() => navigate("/app/vehicles/new")}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Vehicle</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead className="hidden md:table-cell">Registration</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : <div className="flex flex-col items-center gap-2"><Car className="h-6 w-6 text-muted-foreground/40" /><span>No vehicles registered</span></div>}
                </TableCell></TableRow>
              ) : vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-sm font-medium">{v.description}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{v.registration_number ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">{v.vehicle_type === "rental" ? "Rental" : "Business Use"}</Badge>
                  </TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/vehicles/${v.id}`)}><Pencil className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;
