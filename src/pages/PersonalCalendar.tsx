import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock } from "lucide-react";
import type { CalendarEvent, EventType } from "@/lib/personal-types";

const EVENT_TYPES: { value: EventType; label: string; color: string; badge: string }[] = [
  { value: "appointment", label: "Appointment", color: "#3b82f6", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "deadline", label: "Deadline", color: "#ef4444", badge: "bg-red-100 text-red-700 border-red-200" },
  { value: "reminder", label: "Reminder", color: "#eab308", badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "birthday", label: "Birthday", color: "#8b5cf6", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "other", label: "Other", color: "#6b7280", badge: "bg-slate-100 text-slate-600 border-slate-200" },
];

function getEventTypeInfo(type: EventType) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[4];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function padDate(n: number) {
  return String(n).padStart(2, "0");
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${padDate(month + 1)}-${padDate(day)}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface EventForm {
  title: string;
  date: string;
  time: string;
  type: EventType;
  description: string;
  allDay: boolean;
}

const defaultForm: EventForm = {
  title: "",
  date: todayStr(),
  time: "",
  type: "appointment",
  description: "",
  allDay: false,
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PersonalCalendar = () => {
  const { calendarEvents, setCalendarEvents } = usePersonalData();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr());
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(defaultForm);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  function addEvent() {
    if (!form.title.trim() || !form.date) return;
    const ev: CalendarEvent = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      date: form.date,
      time: form.time || undefined,
      type: form.type,
      description: form.description || undefined,
      allDay: form.allDay,
      createdAt: new Date().toISOString(),
    };
    setCalendarEvents((prev) => [...prev, ev]);
    setForm(defaultForm);
    setNewOpen(false);
  }

  function deleteEvent(id: string) {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const days = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);

  const eventsMap: Record<string, CalendarEvent[]> = {};
  calendarEvents.forEach((e) => {
    if (!eventsMap[e.date]) eventsMap[e.date] = [];
    eventsMap[e.date].push(e);
  });

  const selectedEvents = selectedDay ? (eventsMap[selectedDay] ?? []) : [];
  const today = todayStr();

  // Upcoming 7 days
  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);
  const upcoming = calendarEvents
    .filter((e) => e.date >= today && e.date <= upcomingEnd.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Calendar</h1>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Event</DialogTitle>
            </DialogHeader>
            <EventFormContent form={form} setForm={setForm} onSave={addEvent} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const hasEvents = !!eventsMap[dateStr]?.length;
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(dateStr)}
                      className={`relative flex flex-col items-center rounded p-1 text-sm transition-colors min-h-[36px] ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isToday
                          ? "border border-primary text-primary font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      {day}
                      {hasEvents && (
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Upcoming — next 7 days</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing upcoming.</p>
              ) : (
                upcoming.map((ev) => {
                  const info = getEventTypeInfo(ev.type);
                  return (
                    <div key={ev.id} className="flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: info.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${info.badge}`}>{ev.type}</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedDay ? new Date(selectedDay + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", month: "long", day: "numeric" }) : "Select a day"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events this day.</p>
              ) : (
                selectedEvents
                  .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
                  .map((ev) => {
                    const info = getEventTypeInfo(ev.type);
                    return (
                      <div key={ev.id} className="rounded-lg border p-3" style={{ borderLeft: `3px solid ${info.color}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{ev.title}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => deleteEvent(ev.id)}
                          >
                            ×
                          </Button>
                        </div>
                        {ev.time && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" /> {ev.time}
                          </p>
                        )}
                        <Badge variant="outline" className={`text-xs mt-1 ${info.badge}`}>{ev.type}</Badge>
                        {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                      </div>
                    );
                  })
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForm({ ...defaultForm, date: selectedDay ?? todayStr() });
                  setNewOpen(true);
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Add event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface EventFormContentProps {
  form: EventForm;
  setForm: (f: EventForm) => void;
  onSave: () => void;
}

function EventFormContent({ form, setForm, onSave }: EventFormContentProps) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="mt-1" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Time</Label>
          <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1" disabled={form.allDay} />
        </div>
      </div>
      <div>
        <Label>Type</Label>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as EventType })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked, time: e.target.checked ? "" : form.time })} className="rounded" />
        All day
      </label>
      <Button onClick={onSave} disabled={!form.title.trim() || !form.date}>Add Event</Button>
    </div>
  );
}

export default PersonalCalendar;
