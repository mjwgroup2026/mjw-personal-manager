import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { Habit, HabitColor } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Flame, CheckCircle2 } from "lucide-react";

const colorMap: Record<HabitColor, string> = {
  coral: "#f87171", blue: "#3b82f6", purple: "#a855f7", green: "#22c55e", orange: "#f97316",
};
const blank = () => ({ name: "", detail: "", color: "blue" as HabitColor });

export default function PersonalHabits() {
  const { habits, setHabits } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [editId, setEditId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const doneToday = !h.doneToday;
      return { ...h, doneToday, streak: doneToday ? h.streak + 1 : Math.max(0, h.streak - 1) };
    }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setHabits((prev) => prev.map((h) => h.id === editId ? { ...h, name: form.name, detail: form.detail, color: form.color } : h));
    } else {
      setHabits((prev) => [...prev, { id: crypto.randomUUID(), name: form.name, detail: form.detail, color: form.color, streak: 0, doneToday: false, createdAt: now }]);
    }
    setOpen(false); setForm(blank()); setEditId(null);
  };

  const remove = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));
  const doneCount = habits.filter((h) => h.doneToday).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display">Habits</h1>
          {habits.length > 0 && <p className="text-sm text-muted-foreground font-body mt-0.5">{doneCount}/{habits.length} done today</p>}
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Habit
        </Button>
      </div>
      {habits.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-10">No habits yet. Start tracking a daily habit.</p>}
      <div className="space-y-2">
        {habits.map((h) => (
          <Card key={h.id} className={h.doneToday ? "border-green-200 bg-green-50/50" : ""}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <button onClick={() => toggle(h.id)} className="shrink-0 rounded-full p-1 transition-colors" style={{ color: colorMap[h.color] }}>
                {h.doneToday
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <div className="h-5 w-5 rounded-full border-2" style={{ borderColor: colorMap[h.color] }} />}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setForm({ name: h.name, detail: h.detail ?? "", color: h.color }); setEditId(h.id); setOpen(true); }}>
                <p className={`text-sm font-body font-medium ${h.doneToday ? "line-through text-muted-foreground" : "text-foreground"}`}>{h.name}</p>
                {h.detail && <p className="text-[11px] text-muted-foreground font-body">{h.detail}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-bold font-body text-orange-500">{h.streak}</span>
              </div>
              <button onClick={() => remove(h.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors ml-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Habit" : "New Habit"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="font-body text-xs mb-1 block">Habit Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning run" className="font-body" />
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Detail (optional)</Label>
              <Input value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} placeholder="e.g. 30 min" className="font-body" />
            </div>
            <div>
              <Label className="font-body text-xs mb-2 block">Colour</Label>
              <div className="flex gap-2">
                {(Object.entries(colorMap) as [HabitColor, string][]).map(([key, hex]) => (
                  <button key={key} onClick={() => setForm((f) => ({ ...f, color: key }))}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${form.color === key ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: hex }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Habit"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
