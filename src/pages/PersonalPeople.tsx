import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Phone, Mail, Cake, AlertCircle } from "lucide-react";
import type { Person } from "@/lib/personal-types";

const COLOR_OPTIONS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#e66e52", label: "Coral" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#ec4899", label: "Pink" },
  { value: "#14b8a6", label: "Teal" },
];

interface PersonForm {
  name: string;
  relation: string;
  phone: string;
  email: string;
  birthday: string;
  notes: string;
  color: string;
}

const defaultForm: PersonForm = {
  name: "",
  relation: "",
  phone: "",
  email: "",
  birthday: "",
  notes: "",
  color: "#3b82f6",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntilBirthday(birthday: string) {
  if (!birthday) return null;
  const today = new Date();
  const thisYear = today.getFullYear();
  const bday = new Date(birthday);
  let next = new Date(thisYear, bday.getMonth(), bday.getDate());
  if (next < today) next = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
  const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

const PersonalPeople = () => {
  const { people, setPeople } = usePersonalData();
  const [newOpen, setNewOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [form, setForm] = useState<PersonForm>(defaultForm);
  const [editForm, setEditForm] = useState<PersonForm>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Upcoming birthdays (within 7 days)
  const upcomingBirthdays = people.filter((p) => {
    if (!p.birthday) return false;
    const days = daysUntilBirthday(p.birthday);
    return days !== null && days <= 7;
  });

  function addPerson() {
    if (!form.name.trim()) return;
    const p: Person = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      relation: form.relation || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      birthday: form.birthday || undefined,
      notes: form.notes || undefined,
      color: form.color,
      createdAt: new Date().toISOString(),
    };
    setPeople((prev) => [...prev, p]);
    setForm(defaultForm);
    setNewOpen(false);
  }

  function openEdit(p: Person) {
    setEditPerson(p);
    setEditForm({
      name: p.name,
      relation: p.relation ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      birthday: p.birthday ?? "",
      notes: p.notes ?? "",
      color: p.color ?? "#3b82f6",
    });
  }

  function saveEdit() {
    if (!editPerson || !editForm.name.trim()) return;
    setPeople((prev) =>
      prev.map((p) =>
        p.id === editPerson.id
          ? {
              ...p,
              name: editForm.name.trim(),
              relation: editForm.relation || undefined,
              phone: editForm.phone || undefined,
              email: editForm.email || undefined,
              birthday: editForm.birthday || undefined,
              notes: editForm.notes || undefined,
              color: editForm.color,
            }
          : p
      )
    );
    setEditPerson(null);
  }

  function deletePerson(id: string) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    setEditPerson(null);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">People</h1>
          <Badge variant="secondary">{people.length}</Badge>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Person</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Person</DialogTitle></DialogHeader>
            <PersonFormContent form={form} setForm={setForm} onSave={addPerson} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming birthdays banner */}
      {upcomingBirthdays.length > 0 && (
        <div className="mb-4 rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-start gap-2">
          <Cake className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-700">Upcoming Birthdays</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {upcomingBirthdays.map((p) => {
                const days = daysUntilBirthday(p.birthday!);
                return (
                  <span key={p.id} className="text-xs text-purple-600">
                    {p.name} {days === 0 ? "(today!)" : `(in ${days}d)`}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* People grid */}
      {people.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No people yet. Add someone!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {people.map((p) => {
            const followUp = p.notes?.toLowerCase().includes("follow up");
            const daysB = p.birthday ? daysUntilBirthday(p.birthday) : null;
            return (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openEdit(p)}
              >
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: p.color ?? "#3b82f6" }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      {p.relation && <p className="text-xs text-muted-foreground">{p.relation}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {p.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />{p.phone}
                      </div>
                    )}
                    {p.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" />{p.email}
                      </div>
                    )}
                    {p.birthday && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Cake className="h-3 w-3 shrink-0" />{p.birthday}
                        {daysB !== null && daysB <= 30 && (
                          <span className="text-purple-500 font-medium">({daysB === 0 ? "today!" : `${daysB}d`})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {p.relation && <Badge variant="secondary" className="text-xs">{p.relation}</Badge>}
                    {followUp && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                        <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> follow up
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editPerson} onOpenChange={(o) => !o && setEditPerson(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Person</DialogTitle></DialogHeader>
          <PersonFormContent
            form={editForm}
            setForm={setEditForm}
            onSave={saveEdit}
            onDelete={() => editPerson && (deleteConfirm === editPerson.id ? deletePerson(editPerson.id) : setDeleteConfirm(editPerson.id))}
            deleteLabel={deleteConfirm === editPerson?.id ? "Confirm delete" : "Delete"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PersonFormContentProps {
  form: PersonForm;
  setForm: (f: PersonForm) => void;
  onSave: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

function PersonFormContent({ form, setForm, onSave, onDelete, deleteLabel }: PersonFormContentProps) {
  return (
    <div className="flex flex-col gap-3 pt-1 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="mt-1" autoFocus />
      </div>
      <div>
        <Label>Relation</Label>
        <Input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="e.g. Friend, Colleague, Family" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+27..." className="mt-1" />
        </div>
        <div>
          <Label>Birthday</Label>
          <Input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label>Color</Label>
        <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" placeholder="Tip: include 'follow up' to flag this person" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.name.trim()} className="flex-1">Save</Button>
        {onDelete && (
          <Button variant="destructive" onClick={onDelete}>{deleteLabel ?? "Delete"}</Button>
        )}
      </div>
    </div>
  );
}

export default PersonalPeople;
