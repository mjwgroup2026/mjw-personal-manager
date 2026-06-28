import { useEffect, useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Building2, Trash2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const Invoices = () => {
  const { selectedEntity } = useEntity();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchInvoices = async () => {
    if (!selectedEntity) { setLoading(false); return; }
    let query = supabase
      .from("invoices")
      .select("*, invoice_clients(name)")
      .eq("entity_id", selectedEntity.id)
      .order("created_at", { ascending: false });

    if (!showDeleted) query = query.eq("is_deleted", false);

    const { data } = await query;
    setInvoices(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedEntity, showDeleted]);

  const handleSoftDelete = async (id: string) => {
    await supabase.from("invoices").update({ is_deleted: true }).eq("id", id);
    toast({ title: "Invoice archived" });
    await fetchInvoices();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("invoices").update({ is_deleted: false }).eq("id", id);
    toast({ title: "Invoice restored" });
    await fetchInvoices();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  if (!selectedEntity) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="mx-auto mb-4 h-12 w-12 opacity-40" />
          <h2 className="text-lg font-medium">No entity selected</h2>
          <p className="text-sm">Select an entity to manage invoices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {selectedEntity.trading_name || selectedEntity.legal_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {role === "owner" && (
            <div className="flex items-center gap-2">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted" />
              <Label htmlFor="show-deleted" className="text-sm">Show Deleted</Label>
            </div>
          )}
          <Button onClick={() => navigate("/app/invoices/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className={`${inv.is_deleted ? "opacity-50" : "cursor-pointer hover:bg-muted/50"}`}
                  >
                    <TableCell className="font-medium text-sm" onClick={() => !inv.is_deleted && navigate(`/app/invoices/${inv.id}`)}>{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm" onClick={() => !inv.is_deleted && navigate(`/app/invoices/${inv.id}`)}>{format(new Date(inv.issue_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-sm" onClick={() => !inv.is_deleted && navigate(`/app/invoices/${inv.id}`)}>{inv.invoice_clients?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${statusColors[inv.status] ?? ""}`}>
                        {inv.status}
                      </Badge>
                      {inv.is_deleted && <Badge variant="destructive" className="ml-1 text-xs">Deleted</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{inv.vat_applicable ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(inv.grand_total)}
                    </TableCell>
                    <TableCell>
                      {!inv.is_deleted ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                              <AlertDialogDescription>This will archive the invoice. It can be restored later by an owner.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSoftDelete(inv.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        role === "owner" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(inv.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
