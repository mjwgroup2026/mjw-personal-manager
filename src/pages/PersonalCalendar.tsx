import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { CalendarEvent, EventType } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from "date-fns";

const typeColor: Record<EventType, string> = {
  appointment: "bg-blue-500", deadline: "bg-red-500", reminder: "bg-yellow-500", birthday: "bg-pink-500", other: "bg-gray-400",
};
const blank = () => ({ title: "", date: format(new Date(), "yyyy-MM-dd"), time: "", type: "other" as EventType, description: "", allDay: true });

export default function PersonalCalendar() {
  const { calendarEvents, setCalendarEvents } = usePersonalData();
  const [current, setCurrent] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) });
  const startPad = startOfMonth(current).getDay();
  const eventsOnDay = (d: Date) => calendarEvents.filter((e) => isSameDay(parseISO(e.date), d));

  const save = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setCalendarEvents((prev) => prev.map((e) => e.id === editId ? { ...e, ...form } : e));
    } else {
      setCalendarEvents((prev) => [...prev, { ...form, id: crypto.randomUUID(), createdAt: now }]);
    }
    setOpen(false);
  };
  const remove = (id: string) => setCalendarEvents((prev) => prev.filter((e) => e.id !== id));

  const upcoming = [...calendarEvents]
    .filter((e) => parseISO(e.date) >= new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2"><CalendarDays className="h-6 w-6 text-accent" />Calendar</h1>
        <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setForm(blank()); setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Event
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrent(subMonths(current, 1))} className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                <h2 className="text-sm font-bold font-body">{format(current, "MMMM yyyy")}</h2>
                <button onClick={() => setCurrent(addMonths(current, 1))} className="p-1 rounded hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-px">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground font-body pb-1">{d}</div>
                ))}
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map((d) => {
                  const evs = eventsOnDay(d);
                  const isToday = isSameDay(d, new Date());
                  return (
                    <div key={d.toISOString()}
                      className={`min-h-[44px] p-1 rounded cursor-pointer hover:bg-muted/60 transition-colors ${isToday ? "bg-primary/10 ring-1 ring-primary" : ""}`}
                      onClick={() => { setForm({ ...blank(), date: format(d, "yyyy-MM-dd") }); setEditId(null); setOpen(true); }}>
                      <p className={`text-[11px] font-body text-center ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{format(d, "d")}</p>
                      {evs.slice(0, 2).map((e) => (
                        <div key={e.id} className={`text-[9px] text-white rounded px-1 truncate mb-0.5 ${typeColor[e.type]}`}>{e.title}</div>
                      ))}
                      {evs.length > 2 && <div className="text-[9px] text-muted-foreground font-body">+{evs.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-xs font-bold font-body text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.length === 0 && <p className="text-xs text-muted-foreground font-body">No upcoming events</p>}
            {upcoming.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-2.5 px-3 flex items-start gap-2">
                  <div className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${typeColor[e.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{format(parseISO(e.date), "d MMM")}{e.time ? ` · ${e.time}` : ""}</p>
                  </div>
                  <button onClick={() => remove(e.id)} className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editId ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label className="font-body text-xs mb-1 block">Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Event title" className="font-body" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="font-body text-xs mb-1 block">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="font-body" /></div>
              <div><Label className="font-body text-xs mb-1 block">Time (optional)</Label><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="font-body" /></div>
            </div>
            <div>
              <Label className="font-body text-xs mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}>
                <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{(["appointment","deadline","reminder","birthday","other"] as const).map((t) => <SelectItem key={t} value={t} className="font-body capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={save} className="flex-1 bg-primary text-primary-foreground font-body">{editId ? "Save" : "Add Event"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
