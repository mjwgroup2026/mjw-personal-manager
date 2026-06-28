import { useEffect, useState } from "react";
import { useEntity } from "@/contexts/EntityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeftRight, Trash2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions"> & { expense_codes?: { code: string; name: string } | null };

const typeColors: Record<string, string> = {
  income: "bg-green-100 text-green-800",
  expense: "bg-red-100 text-red-800",
  invoice: "bg-blue-100 text-blue-800",
  vat_adjustment: "bg-yellow-100 text-yellow-800",
};

const Transactions = () => {
  const { selectedEntity } = useEntity();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchTransactions = async () => {
    if (!selectedEntity) { setLoading(false); return; }
    let query = supabase
      .from("transactions")
      .select("*, expense_codes(code, name)")
      .eq("entity_id", selectedEntity.id)
      .order("date", { ascending: false })
      .limit(200);

    if (!showDeleted) {
      query = query.eq("is_current", true);
    }

    const { data } = await query;
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedEntity, showDeleted]);

  const handleSoftDelete = async (id: string) => {
    // Soft delete = mark is_current false (versioned ledger approach)
    await supabase.from("transactions").update({ is_current: false, edit_reason: "Soft deleted by user" }).eq("id", id);
    toast({ title: "Transaction archived" });
    await fetchTransactions();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("transactions").update({ is_current: true, edit_reason: "Restored by user" }).eq("id", id);
    toast({ title: "Transaction restored" });
    await fetchTransactions();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

  if (!selectedEntity) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view transactions.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">Central ledger for {selectedEntity.trading_name || selectedEntity.legal_name}</p>
        </div>
        <div className="flex items-center gap-4">
          {role === "owner" && (
            <div className="flex items-center gap-2">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted-tx" />
              <Label htmlFor="show-deleted-tx" className="text-sm">Show Archived</Label>
            </div>
          )}
          <Button onClick={() => navigate("/app/transactions/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">VAT</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className={`${!tx.is_current ? "opacity-50" : "cursor-pointer hover:bg-muted/50"}`}>
                    <TableCell className="text-sm" onClick={() => tx.is_current && navigate(`/app/transactions/${tx.id}`)}>{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                    <TableCell onClick={() => tx.is_current && navigate(`/app/transactions/${tx.id}`)}>
                      <Badge variant="secondary" className={`text-xs ${typeColors[tx.transaction_type] ?? ""}`}>
                        {tx.transaction_type.replace("_", " ")}
                      </Badge>
                      {!tx.is_current && <Badge variant="destructive" className="ml-1 text-xs">Archived</Badge>}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" onClick={() => tx.is_current && navigate(`/app/transactions/${tx.id}`)}>{tx.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.expense_codes?.code ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(tx.gross_amount)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(tx.vat_amount)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(tx.net_amount)}</TableCell>
                    <TableCell>
                      {tx.is_current ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This will archive the transaction. It can be restored later.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSoftDelete(tx.id)}>Archive</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        role === "owner" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(tx.id)}>
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

export default Transactions;
