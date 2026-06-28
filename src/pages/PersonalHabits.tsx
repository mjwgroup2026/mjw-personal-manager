import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, CheckCircle2, Circle, Flame, RotateCcw } from "lucide-react";
import type { Habit, HabitColor } from "@/lib/personal-types";

const HABIT_COLORS: Record<HabitColor, string> = {
  coral: "#e66e52",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  orange: "#f97316",
};

const COLOR_OPTIONS: { value: HabitColor; label: string }[] = [
  { value: "coral", label: "Coral" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
];

interface HabitForm {
  name: string;
  detail: string;
  color: HabitColor;
}

const defaultForm: HabitForm = { name: "", detail: "", color: "blue" };

const PersonalHabits = () => {
  const { habits, setHabits } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitForm>(defaultForm);
  const [editForm, setEditForm] = useState<HabitForm>(defaultForm);

  const done = habits.filter((h) => h.doneToday).length;
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;

  function toggleHabit(id: string) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, doneToday: !h.doneToday, streak: !h.doneToday ? h.streak + 1 : Math.max(0, h.streak - 1) }
          : h
      )
    );
  }

  function addHabit() {
    if (!form.name.trim()) return;
    const h: Habit = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      detail: form.detail || undefined,
      color: form.color,
      streak: 0,
      doneToday: false,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, h]);
    setForm(defaultForm);
    setOpen(false);
  }

  function openEdit(h: Habit) {
    setEditHabit(h);
    setEditForm({ name: h.name, detail: h.detail ?? "", color: h.color });
  }

  function saveEdit() {
    if (!editHabit || !editForm.name.trim()) return;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === editHabit.id
          ? { ...h, name: editForm.name.trim(), detail: editForm.detail || undefined, color: editForm.color }
          : h
      )
    );
    setEditHabit(null);
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setEditHabit(null);
  }

  function resetToday() {
    setHabits((prev) => prev.map((h) => ({ ...h, doneToday: false })));
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Habits</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToday}>
            <RotateCcw className="mr-1 h-3 w-3" /> Reset today
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>New Habit</DialogTitle>
              </DialogHeader>
              <HabitForm form={form} setForm={setForm} onSave={addHabit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Today progress */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today's Progress</span>
            <span className="text-sm text-muted-foreground">
              {done}/{habits.length} done · {pct}%
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>

      {/* Habit cards */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No habits yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((h) => {
            const hex = HABIT_COLORS[h.color] ?? "#6b7280";
            return (
              <Card
                key={h.id}
                className={`cursor-pointer transition-all ${h.doneToday ? "opacity-80" : ""}`}
                style={{ borderLeft: `4px solid ${hex}` }}
                onClick={() => openEdit(h)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHabit(h.id); }}
                    className="shrink-0"
                  >
                    {h.doneToday ? (
                      <CheckCircle2 className="h-8 w-8" style={{ color: hex }} />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${h.doneToday ? "line-through text-muted-foreground" : ""}`}>
                      {h.name}
                    </p>
                    {h.detail && <p className="text-xs text-muted-foreground">{h.detail}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      <span className="text-xs font-semibold">{h.streak}</span>
                    </div>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: hex }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editHabit} onOpenChange={(o) => !o && setEditHabit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          <HabitForm
            form={editForm}
            setForm={setEditForm}
            onSave={saveEdit}
            onDelete={() => editHabit && deleteHabit(editHabit.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface HabitFormProps {
  form: HabitForm;
  setForm: (f: HabitForm) => void;
  onSave: () => void;
  onDelete?: () => void;
}

function HabitForm({ form, setForm, onSave, onDelete }: HabitFormProps) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <Label>Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Morning walk"
          className="mt-1"
          autoFocus
        />
      </div>
      <div>
        <Label>Detail</Label>
        <Input
          value={form.detail}
          onChange={(e) => setForm({ ...form, detail: e.target.value })}
          placeholder="e.g. 30 min, 8 glasses"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Color</Label>
        <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v as HabitColor })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full inline-block"
                    style={{ backgroundColor: HABIT_COLORS[c.value] }}
                  />
                  {c.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={onSave} disabled={!form.name.trim()} className="flex-1">
          Save
        </Button>
        {onDelete && (
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default PersonalHabits;
