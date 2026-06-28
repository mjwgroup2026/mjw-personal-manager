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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pill, Check, X, Clock, Trash2 } from "lucide-react";
import type { Medication, MedicationLog, MedicationLogStatus } from "@/lib/personal-types";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowHHMM() { const n = new Date(); return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`; }

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  }).reverse();
}

function isMissed(scheduledTime: string, logs: MedicationLog[], medId: string, date: string): boolean {
  const logged = logs.find((l) => l.medicationId === medId && l.date === date && l.scheduledTime === scheduledTime);
  if (logged) return false;
  const now = new Date();
  const [h, m] = scheduledTime.split(":").map(Number);
  const scheduled = new Date(date + "T00:00:00");
  scheduled.setHours(h, m);
  return scheduled.getTime() + 30 * 60 * 1000 < now.getTime();
}

interface MedForm {
  name: string;
  dosage: string;
  instructions: string;
  scheduleTimes: string[];
  startDate: string;
  endDate: string;
  active: boolean;
}

const defaultMedForm: MedForm = {
  name: "",
  dosage: "",
  instructions: "",
  scheduleTimes: ["08:00"],
  startDate: todayStr(),
  endDate: "",
  active: true,
};

const PersonalMedications = () => {
  const { medications, setMedications, medicationLogs, setMedicationLogs } = usePersonalData();

  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState<MedForm>(defaultMedForm);
  const [newTimeInput, setNewTimeInput] = useState<Record<string, string>>({});

  const today = todayStr();
  const activeMeds = medications.filter((m) => m.active);
  const days7 = last7Days();

  function addMedication() {
    if (!form.name.trim()) return;
    const m: Medication = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      dosage: form.dosage || undefined,
      instructions: form.instructions || undefined,
      scheduleTimes: form.scheduleTimes.filter(Boolean),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      active: form.active,
      createdAt: new Date().toISOString(),
    };
    setMedications((prev) => [...prev, m]);
    setForm(defaultMedForm);
    setNewOpen(false);
  }

  function toggleMedActive(id: string) {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  }

  function deleteMed(id: string) {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }

  function logDose(medId: string, scheduledTime: string, status: MedicationLogStatus) {
    // Remove existing log for this slot first
    const filtered = medicationLogs.filter(
      (l) => !(l.medicationId === medId && l.date === today && l.scheduledTime === scheduledTime)
    );
    const log: MedicationLog = {
      id: crypto.randomUUID(),
      medicationId: medId,
      date: today,
      scheduledTime,
      status,
      loggedAt: new Date().toISOString(),
    };
    setMedicationLogs([...filtered, log]);
  }

  function getLog(medId: string, time: string, date: string) {
    return medicationLogs.find((l) => l.medicationId === medId && l.date === date && l.scheduledTime === time);
  }

  function doseStatusColor(status: MedicationLogStatus) {
    if (status === "taken") return "bg-green-100 text-green-700 border-green-200";
    if (status === "skipped") return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Medications</h1>
          <Badge variant="secondary">{activeMeds.length} active</Badge>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Medication</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Medication</DialogTitle></DialogHeader>
            <MedFormContent form={form} setForm={setForm} onSave={addMedication} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's dose log */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" /> Today's Doses — {today}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active medications.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeMeds.map((med) => (
                <div key={med.id}>
                  <p className="text-sm font-semibold mb-1">{med.name} {med.dosage && <span className="font-normal text-muted-foreground">· {med.dosage}</span>}</p>
                  <div className="flex flex-wrap gap-2">
                    {med.scheduleTimes.map((time) => {
                      const log = getLog(med.id, time, today);
                      const missed = !log && isMissed(time, medicationLogs, med.id, today);
                      return (
                        <div key={time} className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 ${
                          log
                            ? doseStatusColor(log.status)
                            : missed
                            ? "bg-red-50 border-red-200"
                            : "bg-background"
                        }`}>
                          <span className="text-xs font-mono font-medium">{time}</span>
                          {log ? (
                            <Badge variant="outline" className={`text-xs ${doseStatusColor(log.status)}`}>
                              {log.status}
                            </Badge>
                          ) : missed ? (
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-600 border-red-200">missed</Badge>
                          ) : null}
                          {!log && (
                            <div className="flex gap-1 ml-1">
                              <Button size="icon" className="h-6 w-6 bg-green-500 hover:bg-green-600" onClick={() => logDose(med.id, time, "taken")}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => logDose(med.id, time, "skipped")}>
                                <X className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-6 w-6 text-yellow-600" onClick={() => logDose(med.id, time, "snoozed")}>
                                <Clock className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {log && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 ml-1"
                              onClick={() => setMedicationLogs((prev) => prev.filter((l) => l.id !== log.id))}
                            >
                              ↺
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications list */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Medications</CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications added.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {medications.map((med) => (
                <div key={med.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{med.name}</p>
                      {med.dosage && <span className="text-xs text-muted-foreground">{med.dosage}</span>}
                      <Badge variant={med.active ? "default" : "secondary"} className="text-xs">
                        {med.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {med.instructions && <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {med.scheduleTimes.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>
                      ))}
                    </div>
                    {(med.startDate || med.endDate) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {med.startDate && `From ${med.startDate}`}{med.endDate && ` to ${med.endDate}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleMedActive(med.id)}>
                      {med.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMed(med.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">History — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {medicationLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...medicationLogs]
                    .filter((l) => l.date >= days7[0])
                    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
                    .map((log) => {
                      const med = medications.find((m) => m.id === log.medicationId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{log.date}</TableCell>
                          <TableCell className="text-xs">{med?.name ?? "Unknown"}</TableCell>
                          <TableCell className="text-xs font-mono">{log.scheduledTime}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${doseStatusColor(log.status)}`}>
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function doseStatusColor(status: MedicationLogStatus) {
  if (status === "taken") return "bg-green-100 text-green-700 border-green-200";
  if (status === "skipped") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

interface MedFormContentProps {
  form: MedForm;
  setForm: (f: MedForm) => void;
  onSave: () => void;
}

function MedFormContent({ form, setForm, onSave }: MedFormContentProps) {
  const [timeInput, setTimeInput] = useState("08:00");

  function addTime() {
    if (!timeInput || form.scheduleTimes.includes(timeInput)) return;
    setForm({ ...form, scheduleTimes: [...form.scheduleTimes, timeInput].sort() });
  }

  function removeTime(t: string) {
    setForm({ ...form, scheduleTimes: form.scheduleTimes.filter((x) => x !== t) });
  }

  return (
    <div className="flex flex-col gap-3 pt-1 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Medication name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Metformin" className="mt-1" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Dosage</Label>
          <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 500mg" className="mt-1" />
        </div>
        <div>
          <Label>Active</Label>
          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Active medication
            </label>
          </div>
        </div>
      </div>
      <div>
        <Label>Instructions</Label>
        <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} className="mt-1" placeholder="e.g. Take with food" />
      </div>
      <div>
        <Label>Schedule times</Label>
        <div className="flex gap-2 mt-1">
          <Input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className="flex-1" />
          <Button variant="outline" size="sm" onClick={addTime}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {form.scheduleTimes.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 font-mono text-xs cursor-pointer" onClick={() => removeTime(t)}>
              {t} ×
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start date</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>End date</Label>
          <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
        </div>
      </div>
      <Button onClick={onSave} disabled={!form.name.trim()}>Save Medication</Button>
    </div>
  );
}

export default PersonalMedications;
