import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { Medication } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pill, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

const blank = (): Partial<Medication> => ({ name: "", dosage: "", instructions: "", scheduleTimes: ["08:00"], active: true });

export default function PersonalMedications() {
  const { medications, setMedications, medicationLogs, setMedicationLogs } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Medication>>(blank());
  const [timeInput, setTimeInput] = useState("08:00");

  const today = format(new Date(), "yyyy-MM-dd");
  const active = medications.filter((m) => m.active);

  const isTaken = (medId: string, time: string) =>
    medicationLogs.some((l) => l.medicationId === medId && l.date === today && l.scheduledTime === time && l.status === "taken");

  const toggleLog = (medId: string, time: string) => {
    const taken = isTaken(medId, time);
    if (taken) {
      setMedicationLogs((prev) => prev.filter((l) => !(l.medicationId === medId && l.date === today && l.scheduledTime === time)));
    } else {
      setMedicationLogs((prev) => [...prev, { id: crypto.randomUUID(), medicationId: medId, date: today, scheduledTime: time, status: "taken", loggedAt: new Date().toISOString() }]);
    }
  };

  const save = () => {
    if (!form.name?.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setMedications((prev) => prev.map((m) => m.id === editId ? { ...m, ...form } as Medication : m));
    } else {
      setMedications((prev) => [...prev, { ...form, id: crypto.randomUUID(), createdAt: now } as Medication]);
    }
    setOpen(false); setForm(blank()); setEditId(null);
  };

  const remove = (id: string) => setMedications((prev) => prev.filter((m) => m.id !== id));

  const addTime = () => {
    if (!timeInput) return;
    setForm((f) => ({ ...f, scheduleTimes: [...(f.scheduleTimes ?? []), timeInput].sort() }));
  };
  const removeTime = (t: string) => setForm((f) => ({ ...f, scheduleTimes: (f.scheduleTimes ?? []).filter((x) => x !== t) }));

  const openEdit = (m: Medication) => {
    setForm({ name: m.name, dosage: m.dosage, instructions: m.instructions, scheduleTimes: [...m.scheduleTimes], active: m.active });
    setEditId(m.id); setOpen(true);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2"><Pill className="h-6 w-6 text-purple-500" />Medication</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Medication
        </Button>
      </div>
      <p className="text-xs text-muted-foreground font-body mb-4">Today — {format(new Date(), "EEEE, d MMMM yyyy")}</p>
      {active.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-10">No active medications. Add one to start tracking.</p>}
      <div className="space-y-3">
        {active.map((m) => {
          const takenCount = m.scheduleTimes.filter((t) => isTaken(m.id, t)).length;
          return (
            <Card key={m.id}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="cursor-pointer" onClick={() => openEdit(m)}>
                    <CardTitle className="text-sm font-body font-bold flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-purple-500" /> {m.name}
                    </CardTitle>
                    {m.dosage && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{m.dosage}</p>}
                    {m.instructions && <p className="text-[11px] text-muted-foreground font-body">{m.instructions}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-body text-muted-foreground">{takenCount}/{m.scheduleTimes.length} today</span>
                    <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {m.scheduleTimes.map((t) => {
                    const taken = isTaken(m.id, t);
                    return (
                      <button key={t} onClick={() => toggleLog(m.id, t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-body font-medium transition-all ${taken ? "bg-green-50 border-green-200 text-green-700" : "bg-muted border-border text-muted-foreground hover:border-primary"}`}>
                        {taken ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {medications.filter((m) => !m.active).length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wider mb-2">Inactive</p>
          {medications.filter((m) => !m.active).map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
              <p className="text-xs font-body text-muted-foreground flex-1">{m.name}</p>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] font-body" onClick={() => setMedications((prev) => prev.map((x) => x.id === m.id ? { ...x, active: true } : x))}>Reactivate</Button>
              <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Medication" : "Add Medication"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label className="font-body text-xs mb-1 block">Medication Name *</Label><Input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Metformin" className="font-body" /></div>
            <div><Label className="font-body text-xs mb-1 block">Dosage</Label><Input value={form.dosage ?? ""} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" className="font-body" /></div>
            <div><Label className="font-body text-xs mb-1 block">Instructions</Label><Input value={form.instructions ?? ""} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} placeholder="e.g. Take with food" className="font-body" /></div>
            <div>
              <Label className="font-body text-xs mb-1 block">Schedule Times</Label>
              <div className="flex gap-2">
                <Input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="font-body" />
                <Button variant="outline" size="sm" onClick={addTime} className="font-body shrink-0">Add Time</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(form.scheduleTimes ?? []).map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-muted text-xs font-body px-2 py-1 rounded-full">
                    {t}
                    <button onClick={() => removeTime(t)} className="text-muted-foreground hover:text-destructive ml-0.5">x</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Medication"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
