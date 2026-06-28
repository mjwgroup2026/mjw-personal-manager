import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { Person } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Users, Phone, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";

const COLORS = ["#3b82f6","#a855f7","#22c55e","#f97316","#f43f5e","#06b6d4","#eab308"];
const blank = (): Partial<Person> => ({ name: "", relation: "", phone: "", email: "", birthday: "", notes: "", color: COLORS[0] });

export default function PersonalPeople() {
  const { people, setPeople } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Person>>(blank());
  const [search, setSearch] = useState("");

  const filtered = people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (!form.name?.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setPeople((prev) => prev.map((p) => p.id === editId ? { ...p, ...form } as Person : p));
    } else {
      setPeople((prev) => [...prev, { ...form, id: crypto.randomUUID(), createdAt: now } as Person]);
    }
    setOpen(false); setForm(blank()); setEditId(null);
  };

  const remove = (id: string) => setPeople((prev) => prev.filter((p) => p.id !== id));
  const openEdit = (p: Person) => {
    setForm({ name: p.name, relation: p.relation, phone: p.phone, email: p.email, birthday: p.birthday, notes: p.notes, color: p.color });
    setEditId(p.id); setOpen(true);
  };
  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2"><Users className="h-6 w-6 text-secondary" />People</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Person
        </Button>
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..." className="mb-4 font-body" />
      {filtered.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-10">No people added yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => openEdit(p)}>
            <CardContent className="py-3 px-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold font-body shrink-0" style={{ background: p.color ?? COLORS[0] }}>
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-body text-foreground">{p.name}</p>
                {p.relation && <p className="text-[11px] text-muted-foreground font-body">{p.relation}</p>}
                <div className="flex flex-wrap gap-2 mt-1">
                  {p.phone && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body"><Phone className="h-2.5 w-2.5" />{p.phone}</span>}
                  {p.email && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body"><Mail className="h-2.5 w-2.5" />{p.email}</span>}
                </div>
                {p.birthday && <p className="text-[10px] text-muted-foreground font-body mt-0.5">🎂 {format(parseISO(p.birthday), "d MMM")}</p>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Person" : "Add Person"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label className="font-body text-xs mb-1 block">Name *</Label><Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="font-body" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="font-body text-xs mb-1 block">Relationship</Label><Input value={form.relation ?? ""} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} placeholder="e.g. Friend" className="font-body" /></div>
              <div><Label className="font-body text-xs mb-1 block">Birthday</Label><Input type="date" value={form.birthday ?? ""} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} className="font-body" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="font-body text-xs mb-1 block">Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+27..." className="font-body" /></div>
              <div><Label className="font-body text-xs mb-1 block">Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="font-body" /></div>
            </div>
            <div>
              <Label className="font-body text-xs mb-2 block">Colour</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div><Label className="font-body text-xs mb-1 block">Notes</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." rows={3} className="font-body text-sm resize-none" /></div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Person"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
