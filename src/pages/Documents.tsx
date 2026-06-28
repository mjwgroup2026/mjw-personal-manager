import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntity } from "@/contexts/EntityContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import {
  Upload, FileText, Pencil, RefreshCw, Trash2, RotateCcw, History, Eye, Download,
} from "lucide-react";
import { format } from "date-fns";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const CATEGORIES = ["Invoice", "Receipt", "Contract", "Tax Certificate", "Bank Statement", "Other"];

interface Doc {
  id: string;
  entity_id: string;
  transaction_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string | null;
  tax_year: string | null;
  description: string | null;
  tags: string[] | null;
  version: number;
  is_deleted: boolean;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DocVersion {
  id: string;
  document_id: string;
  file_path: string;
  replaced_by: string | null;
  replaced_at: string;
  edit_reason: string;
}

const Documents = () => {
  const { user, role } = useAuth();
  const { selectedEntity } = useEntity();
  const { toast } = useToast();

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadTaxYear, setUploadTaxYear] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit dialog
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editTaxYear, setEditTaxYear] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editTransactionId, setEditTransactionId] = useState("");

  // Replace dialog
  const [replaceDoc, setReplaceDoc] = useState<Doc | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceReason, setReplaceReason] = useState("");
  const replaceFileRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);

  // Version history drawer
  const [versionDoc, setVersionDoc] = useState<Doc | null>(null);
  const [versions, setVersions] = useState<DocVersion[]>([]);

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");

  const fetchDocs = useCallback(async () => {
    if (!selectedEntity) return;
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("entity_id", selectedEntity.id)
      .order("created_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
    setLoading(false);
  }, [selectedEntity]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const filteredDocs = docs.filter((d) => (showDeleted ? true : !d.is_deleted));

  // Tax years for dropdown
  const currentYear = new Date().getFullYear();
  const taxYears = Array.from({ length: 6 }, (_, i) => `${currentYear - i}/${currentYear - i + 1}`);

  // --- UPLOAD ---
  const handleUpload = async () => {
    if (!uploadFile || !selectedEntity || !user) return;
    if (!ALLOWED_TYPES.includes(uploadFile.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, JPG, PNG allowed.", variant: "destructive" });
      return;
    }
    if (uploadFile.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max 10MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${selectedEntity.id}/${crypto.randomUUID()}_${uploadFile.name}`;
    const { error: storageError } = await supabase.storage.from("documents").upload(filePath, uploadFile);
    if (storageError) {
      toast({ title: "Upload failed", description: storageError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("documents").insert({
      entity_id: selectedEntity.id,
      file_path: filePath,
      file_name: uploadFile.name,
      file_type: uploadFile.type,
      file_size: uploadFile.size,
      category: uploadCategory || null,
      tax_year: uploadTaxYear || null,
      description: uploadDesc || null,
      created_by: user.id,
    });

    if (dbError) {
      toast({ title: "Error saving document", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded" });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadCategory("");
      setUploadTaxYear("");
      setUploadDesc("");
      fetchDocs();
    }
    setUploading(false);
  };

  // --- EDIT ---
  const openEdit = (doc: Doc) => {
    setEditDoc(doc);
    setEditCategory(doc.category ?? "");
    setEditTaxYear(doc.tax_year ?? "");
    setEditDesc(doc.description ?? "");
    setEditTags(doc.tags?.join(", ") ?? "");
    setEditTransactionId(doc.transaction_id ?? "");
    setEditReason("");
  };

  const handleEdit = async () => {
    if (!editDoc || !user || !editReason.trim()) {
      toast({ title: "Edit reason required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("documents").update({
      category: editCategory || null,
      tax_year: editTaxYear || null,
      description: editDesc || null,
      tags: editTags ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      transaction_id: editTransactionId || null,
      updated_by: user.id,
    }).eq("id", editDoc.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document updated" });
      setEditDoc(null);
      fetchDocs();
    }
  };

  // --- REPLACE FILE ---
  const handleReplace = async () => {
    if (!replaceDoc || !replaceFile || !user || !replaceReason.trim()) {
      toast({ title: "Replacement file and reason required", variant: "destructive" });
      return;
    }
    if (!ALLOWED_TYPES.includes(replaceFile.type)) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }
    if (replaceFile.size > MAX_SIZE) {
      toast({ title: "File too large", variant: "destructive" });
      return;
    }

    setUploading(true);
    // 1. Store old version
    const { error: versionError } = await supabase.from("document_versions").insert({
      document_id: replaceDoc.id,
      file_path: replaceDoc.file_path,
      replaced_by: user.id,
      edit_reason: replaceReason,
    });
    if (versionError) {
      toast({ title: "Version log failed", description: versionError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // 2. Upload new file
    const newPath = `${replaceDoc.entity_id}/${crypto.randomUUID()}_${replaceFile.name}`;
    const { error: storageError } = await supabase.storage.from("documents").upload(newPath, replaceFile);
    if (storageError) {
      toast({ title: "Upload failed", description: storageError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // 3. Update document record
    const { error: updateError } = await supabase.from("documents").update({
      file_path: newPath,
      file_name: replaceFile.name,
      file_type: replaceFile.type,
      file_size: replaceFile.size,
      version: replaceDoc.version + 1,
      updated_by: user.id,
    }).eq("id", replaceDoc.id);

    if (updateError) {
      toast({ title: "Update failed", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "File replaced", description: `Now at version ${replaceDoc.version + 1}` });
      setReplaceDoc(null);
      setReplaceFile(null);
      setReplaceReason("");
      fetchDocs();
    }
    setUploading(false);
  };

  // --- SOFT DELETE ---
  const handleDelete = async () => {
    if (!deleteDoc || !user) return;
    const { error } = await supabase.from("documents").update({
      is_deleted: true,
      updated_by: user.id,
    }).eq("id", deleteDoc.id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted (soft)" });
      setDeleteDoc(null);
      fetchDocs();
    }
  };

  // --- RESTORE ---
  const handleRestore = async (doc: Doc) => {
    if (!user) return;
    const { error } = await supabase.from("documents").update({
      is_deleted: false,
      updated_by: user.id,
    }).eq("id", doc.id);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document restored" });
      fetchDocs();
    }
  };

  // --- VERSION HISTORY ---
  const openVersions = async (doc: Doc) => {
    setVersionDoc(doc);
    const { data } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", doc.id)
      .order("replaced_at", { ascending: false });
    setVersions((data as DocVersion[]) ?? []);
  };

  // --- PREVIEW / DOWNLOAD ---
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 300);
    if (error) {
      toast({ title: "Could not get URL", description: error.message, variant: "destructive" });
      return null;
    }
    return data.signedUrl;
  };

  const handlePreview = async (doc: Doc) => {
    const url = await getSignedUrl(doc.file_path);
    if (url) {
      setPreviewUrl(url);
      setPreviewType(doc.file_type);
    }
  };

  const handleDownload = async (doc: Doc) => {
    const url = await getSignedUrl(doc.file_path);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      a.click();
    }
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!selectedEntity) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Select an entity first.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">{filteredDocs.length} documents</p>
        </div>
        <div className="flex items-center gap-3">
          {role === "owner" && (
            <div className="flex items-center gap-2">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} id="show-deleted" />
              <Label htmlFor="show-deleted" className="text-sm text-muted-foreground">Show Deleted</Label>
            </div>
          )}
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tax Year</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Ver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className={doc.is_deleted ? "opacity-50" : ""}>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">{doc.file_name}</span>
                        {doc.is_deleted && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
                      </div>
                      {doc.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.description}</p>}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{doc.category ?? "—"}</Badge></TableCell>
                    <TableCell className="text-sm">{doc.tax_year ?? "—"}</TableCell>
                    <TableCell className="text-sm">{formatBytes(doc.file_size)}</TableCell>
                    <TableCell className="text-sm">v{doc.version}</TableCell>
                    <TableCell className="text-sm">{format(new Date(doc.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)} title="Preview">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        {!doc.is_deleted && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(doc)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setReplaceDoc(doc); setReplaceFile(null); setReplaceReason(""); }} title="Replace File">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openVersions(doc)} title="Version History">
                              <History className="h-4 w-4" />
                            </Button>
                            {role === "owner" && (
                              <Button variant="ghost" size="icon" onClick={() => setDeleteDoc(doc)} title="Delete">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </>
                        )}
                        {doc.is_deleted && role === "owner" && (
                          <Button variant="ghost" size="icon" onClick={() => handleRestore(doc)} title="Restore">
                            <RotateCcw className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a PDF, JPG, or PNG file (max 10MB).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File</Label>
              <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax Year</Label>
                <Select value={uploadTaxYear} onValueChange={setUploadTaxYear}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {taxYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => { if (!open) setEditDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update metadata for {editDoc?.file_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax Year</Label>
                <Select value={editTaxYear} onValueChange={setEditTaxYear}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {taxYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g. vat, sars" />
            </div>
            <div>
              <Label>Linked Transaction ID</Label>
              <Input value={editTransactionId} onChange={(e) => setEditTransactionId(e.target.value)} placeholder="Optional UUID" />
            </div>
            <div>
              <Label>Edit Reason *</Label>
              <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Why are you editing?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editReason.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Dialog */}
      <Dialog open={!!replaceDoc} onOpenChange={(open) => { if (!open) setReplaceDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace File</DialogTitle>
            <DialogDescription>Replace the file for {replaceDoc?.file_name} (v{replaceDoc?.version})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New File</Label>
              <Input ref={replaceFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>Reason for replacement *</Label>
              <Input value={replaceReason} onChange={(e) => setReplaceReason(e.target.value)} placeholder="Why are you replacing this file?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceDoc(null)}>Cancel</Button>
            <Button onClick={handleReplace} disabled={!replaceFile || !replaceReason.trim() || uploading}>
              {uploading ? "Replacing..." : "Replace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDoc} onOpenChange={(open) => { if (!open) setDeleteDoc(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              This will soft-delete "{deleteDoc?.file_name}". The file remains in storage and can be restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Drawer */}
      <Drawer open={!!versionDoc} onOpenChange={(open) => { if (!open) setVersionDoc(null); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Version History — {versionDoc?.file_name}</DrawerTitle>
            <DrawerDescription>Current version: v{versionDoc?.version}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {versions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No previous versions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File Path</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-sm">{format(new Date(v.replaced_at), "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{v.file_path}</TableCell>
                      <TableCell className="text-sm">{v.edit_reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* File Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {previewType === "application/pdf" ? (
              <iframe src={previewUrl!} className="h-[70vh] w-full rounded border" />
            ) : (
              <img src={previewUrl!} alt="Preview" className="max-h-[70vh] rounded" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
