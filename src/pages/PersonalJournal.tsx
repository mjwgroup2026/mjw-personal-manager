import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { JournalEntry, JournalMood } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

const moods: { value: JournalMood; emoji: string; label: string }[] = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "tough", emoji: "😔", label: "Tough" },
];

export default function PersonalJournal() {
  const { journal, setJournal } = usePersonalData();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mood, setMood] = useState<JournalMood>("good");
  const [content, setContent] = useState("");

  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    setEditId(null); setDate(format(new Date(), "yyyy-MM-dd")); setMood("good"); setContent(""); setOpen(true);
  };
  const openEdit = (e: JournalEntry) => {
    setEditId(e.id); setDate(e.date); setMood(e.mood ?? "good"); setContent(e.content); setOpen(true);
  };
  const save = () => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setJournal((prev) => prev.map((e) => e.id === editId ? { ...e, date, mood, content, updatedAt: now } : e));
    } else {
      setJournal((prev) => [...prev, { id: crypto.randomUUID(), date, mood, content, createdAt: now, updatedAt: now }]);
    }
    setOpen(false);
  };
  const remove = (id: string) => setJournal((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2"><BookOpen className="h-6 w-6 text-secondary" />Journal</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New Entry
        </Button>
      </div>
      {sorted.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-10">No journal entries yet. Write your first one.</p>}
      <div className="space-y-3">
        {sorted.map((e) => {
          const moodObj = moods.find((m) => m.value === e.mood);
          return (
            <Card key={e.id} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{moodObj?.emoji ?? "📝"}</span>
                    <div>
                      <p className="text-sm font-bold font-body text-foreground">{format(parseISO(e.date), "EEEE, d MMMM yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{moodObj?.label ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><BookOpen className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4" onClick={() => openEdit(e)}>
                <p className="text-sm text-foreground font-body line-clamp-3 leading-relaxed">{e.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Entry" : "New Journal Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body" />
            <div>
              <p className="text-xs font-body text-muted-foreground mb-2">How are you feeling?</p>
              <div className="flex gap-2">
                {moods.map((m) => (
                  <button key={m.value} onClick={() => setMood(m.value)}
                    className={`flex-1 py-2 rounded-lg text-center text-lg transition-all border ${mood === m.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                    {m.emoji}
                    <p className="text-[9px] font-body text-muted-foreground mt-0.5">{m.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write about your day..." rows={7} className="font-body text-sm resize-none" />
            <div className="flex gap-2">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Entry"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
