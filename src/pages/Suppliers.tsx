import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/contexts/EntityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Suppliers = () => {
  const { selectedEntity } = useEntity();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedEntity) return;
    setLoading(true);
    supabase.from("suppliers").select("*").eq("entity_id", selectedEntity.id).eq("is_deleted", false).order("name")
      .then(({ data }) => { setSuppliers(data ?? []); setLoading(false); });
  }, [selectedEntity]);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!selectedEntity) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select an entity first</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your supplier records</p>
        </div>
        <Button size="sm" onClick={() => navigate("/app/suppliers/new")}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Supplier</Button>
      </div>
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-sm" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead className="hidden md:table-cell">VAT Number</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">{loading ? "Loading..." : "No suppliers found"}</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm font-medium">{s.name}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{s.email ?? "—"}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{s.vat_number ?? "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/suppliers/${s.id}`)}><Pencil className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;
