import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, BookOpen, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { JournalEntry, JournalMood } from "@/lib/personal-types";

const MOODS: { value: JournalMood; label: string; color: string }[] = [
  { value: "great", label: "Great", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "good", label: "Good", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "okay", label: "Okay", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "tough", label: "Tough", color: "bg-red-100 text-red-700 border-red-200" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function moodStyle(mood?: JournalMood) {
  return MOODS.find((m) => m.value === mood)?.color ?? "bg-slate-100 text-slate-600";
}

const PersonalJournal = () => {
  const { journal, setJournal } = usePersonalData();

  const today = todayStr();
  const todayEntry = journal.find((j) => j.date === today);
  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  const [writeOpen, setWriteOpen] = useState(false);
  const [editorContent, setEditorContent] = useState(todayEntry?.content ?? "");
  const [editorMood, setEditorMood] = useState<JournalMood>(todayEntry?.mood ?? "good");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState<JournalMood>("good");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openWrite() {
    setEditorContent(todayEntry?.content ?? "");
    setEditorMood(todayEntry?.mood ?? "good");
    setWriteOpen(true);
  }

  function saveEntry() {
    if (!editorContent.trim()) return;
    if (todayEntry) {
      setJournal((prev) =>
        prev.map((j) =>
          j.id === todayEntry.id
            ? { ...j, content: editorContent, mood: editorMood, updatedAt: new Date().toISOString() }
            : j
        )
      );
    } else {
      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date: today,
        content: editorContent,
        mood: editorMood,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setJournal((prev) => [entry, ...prev]);
    }
    setWriteOpen(false);
  }

  function startEdit(j: JournalEntry) {
    setEditingId(j.id);
    setEditContent(j.content);
    setEditMood(j.mood ?? "good");
  }

  function saveInlineEdit(id: string) {
    setJournal((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, content: editContent, mood: editMood, updatedAt: new Date().toISOString() }
          : j
      )
    );
    setEditingId(null);
  }

  function deleteEntry(id: string) {
    setJournal((prev) => prev.filter((j) => j.id !== id));
    setDeleteConfirm(null);
    setExpandedId(null);
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Journal</h1>
          <Badge variant="secondary">{journal.length} entries</Badge>
        </div>
        <Button size="sm" onClick={openWrite}>
          <Plus className="mr-1 h-4 w-4" />
          {todayEntry ? "Edit today" : "Write today"}
        </Button>
      </div>

      {/* Write dialog */}
      <Dialog open={writeOpen} onOpenChange={setWriteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {todayEntry ? "Edit today's entry" : "Write today's entry"} — {formatDate(today)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <Label>Mood</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setEditorMood(m.value)}
                    className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${
                      editorMood === m.value ? m.color : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Entry</Label>
              <Textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="What's on your mind today?"
                rows={8}
                className="mt-1"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">{wordCount(editorContent)} words</p>
            </div>
            <Button onClick={saveEntry} disabled={!editorContent.trim()}>
              Save Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entries list */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No entries yet. Start writing!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((j) => {
            const isExpanded = expandedId === j.id;
            const isEditing = editingId === j.id;
            const mood = MOODS.find((m) => m.value === j.mood);

            return (
              <Card key={j.id} className={j.date === today ? "border-primary/40" : ""}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => {
                    if (!isEditing) setExpandedId(isExpanded ? null : j.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold">{formatDate(j.date)}</CardTitle>
                      {j.date === today && <Badge variant="outline" className="text-xs border-primary text-primary">Today</Badge>}
                      {mood && (
                        <Badge variant="outline" className={`text-xs ${mood.color}`}>
                          {mood.label}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{wordCount(j.content)} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {!isExpanded && !isEditing ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{j.content}</p>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 flex-wrap">
                        {MOODS.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setEditMood(m.value)}
                            className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                              editMood === m.value ? m.color : "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={6}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground">{wordCount(editContent)} words</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveInlineEdit(j.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{j.content}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(j)}>Edit</Button>
                        {deleteConfirm === j.id ? (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => deleteEntry(j.id)}>Confirm delete</Button>
                            <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(j.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonalJournal;
