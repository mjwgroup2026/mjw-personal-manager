import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Heart, User, Shield, Activity, Phone } from "lucide-react";
import type { HealthReadingType, EmergencyContact, HealthReading } from "@/lib/personal-types";

const READING_TYPES: { value: HealthReadingType; label: string; unit: string }[] = [
  { value: "blood_sugar", label: "Blood Sugar", unit: "mmol/L" },
  { value: "bp", label: "Blood Pressure", unit: "mmHg" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "hba1c", label: "HbA1c", unit: "%" },
  { value: "cholesterol", label: "Cholesterol", unit: "mmol/L" },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "sleep", label: "Sleep", unit: "hrs" },
  { value: "mood", label: "Mood", unit: "/10" },
  { value: "peak_flow", label: "Peak Flow", unit: "L/min" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function todayStr() { return new Date().toISOString().slice(0, 10); }

interface ReadingForm {
  type: HealthReadingType;
  value: string;
  value2: string;
  unit: string;
  date: string;
  time: string;
  notes: string;
}

const defaultReadingForm: ReadingForm = {
  type: "blood_sugar",
  value: "",
  value2: "",
  unit: "mmol/L",
  date: todayStr(),
  time: "",
  notes: "",
};

interface ContactForm {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

const defaultContactForm: ContactForm = { name: "", relationship: "", phone: "", email: "" };

const PersonalHealth = () => {
  const { health, setHealth } = usePersonalData();
  const [readingOpen, setReadingOpen] = useState(false);
  const [readingForm, setReadingForm] = useState<ReadingForm>(defaultReadingForm);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>(defaultContactForm);

  // Local copies of health subfields
  const profile = health.profile;
  const medAid = health.medicalAid;
  const readings = health.readings;
  const contacts = health.emergencyContacts;

  // Profile form state (controlled)
  const [pf, setPf] = useState({
    fullName: profile.fullName ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    idNumber: profile.idNumber ?? "",
    gender: profile.gender ?? "",
    bloodType: profile.bloodType ?? "",
    organDonor: profile.organDonor ?? false,
    clinicalSummary: profile.clinicalSummary ?? "",
    conditions: (profile.conditions ?? []).join(", "),
    allergies: (profile.allergies ?? []).join(", "),
  });

  const [ma, setMa] = useState({
    scheme: medAid.scheme ?? "",
    plan: medAid.plan ?? "",
    memberNumber: medAid.memberNumber ?? "",
    principalMember: medAid.principalMember ?? "",
    authLine: medAid.authLine ?? "",
    emergencyLine: medAid.emergencyLine ?? "",
  });

  function saveProfile() {
    setHealth((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        fullName: pf.fullName || undefined,
        dateOfBirth: pf.dateOfBirth || undefined,
        idNumber: pf.idNumber || undefined,
        gender: pf.gender || undefined,
        bloodType: pf.bloodType || undefined,
        organDonor: pf.organDonor,
        clinicalSummary: pf.clinicalSummary || undefined,
        conditions: pf.conditions ? pf.conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        allergies: pf.allergies ? pf.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      },
    }));
  }

  function saveMedAid() {
    setHealth((prev) => ({
      ...prev,
      medicalAid: {
        scheme: ma.scheme || undefined,
        plan: ma.plan || undefined,
        memberNumber: ma.memberNumber || undefined,
        principalMember: ma.principalMember || undefined,
        authLine: ma.authLine || undefined,
        emergencyLine: ma.emergencyLine || undefined,
      },
    }));
  }

  function addReading() {
    if (!readingForm.value || !readingForm.date) return;
    const r: HealthReading = {
      id: crypto.randomUUID(),
      type: readingForm.type,
      value: Number(readingForm.value),
      value2: readingForm.value2 ? Number(readingForm.value2) : undefined,
      unit: readingForm.unit || undefined,
      date: readingForm.date,
      time: readingForm.time || undefined,
      notes: readingForm.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    setHealth((prev) => ({ ...prev, readings: [r, ...prev.readings] }));
    setReadingForm(defaultReadingForm);
    setReadingOpen(false);
  }

  function deleteReading(id: string) {
    setHealth((prev) => ({ ...prev, readings: prev.readings.filter((r) => r.id !== id) }));
  }

  function addContact() {
    if (!contactForm.name.trim()) return;
    const c: EmergencyContact = {
      id: crypto.randomUUID(),
      name: contactForm.name.trim(),
      relationship: contactForm.relationship || undefined,
      phone: contactForm.phone || undefined,
      email: contactForm.email || undefined,
    };
    setHealth((prev) => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, c] }));
    setContactForm(defaultContactForm);
    setContactOpen(false);
  }

  function deleteContact(id: string) {
    setHealth((prev) => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((c) => c.id !== id) }));
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Health Hub</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-1"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="medaid" className="gap-1"><Shield className="h-3.5 w-3.5" /> Medical Aid</TabsTrigger>
          <TabsTrigger value="readings" className="gap-1"><Activity className="h-3.5 w-3.5" /> Readings</TabsTrigger>
          <TabsTrigger value="emergency" className="gap-1"><Phone className="h-3.5 w-3.5" /> Emergency</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Health Profile</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <Input value={pf.fullName} onChange={(e) => setPf({ ...pf, fullName: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={pf.dateOfBirth} onChange={(e) => setPf({ ...pf, dateOfBirth: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>ID Number</Label>
                  <Input value={pf.idNumber} onChange={(e) => setPf({ ...pf, idNumber: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={pf.gender} onValueChange={(v) => setPf({ ...pf, gender: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Type</Label>
                  <Select value={pf.bloodType} onValueChange={(v) => setPf({ ...pf, bloodType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <input
                    type="checkbox"
                    id="organ-donor"
                    checked={pf.organDonor}
                    onChange={(e) => setPf({ ...pf, organDonor: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="organ-donor" className="cursor-pointer">Organ Donor</Label>
                </div>
              </div>
              <div className="mt-4">
                <Label>Clinical Summary</Label>
                <Textarea value={pf.clinicalSummary} onChange={(e) => setPf({ ...pf, clinicalSummary: e.target.value })} rows={3} className="mt-1" placeholder="Brief clinical history..." />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Conditions (comma-separated)</Label>
                  <Textarea value={pf.conditions} onChange={(e) => setPf({ ...pf, conditions: e.target.value })} rows={2} className="mt-1" placeholder="e.g. Type 2 Diabetes, Hypertension" />
                </div>
                <div>
                  <Label>Allergies (comma-separated)</Label>
                  <Textarea value={pf.allergies} onChange={(e) => setPf({ ...pf, allergies: e.target.value })} rows={2} className="mt-1" placeholder="e.g. Penicillin, Peanuts" />
                </div>
              </div>
              <Button className="mt-4" onClick={saveProfile}>Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Aid tab */}
        <TabsContent value="medaid">
          <Card>
            <CardHeader><CardTitle className="text-base">Medical Aid</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Scheme</Label>
                  <Input value={ma.scheme} onChange={(e) => setMa({ ...ma, scheme: e.target.value })} placeholder="e.g. Discovery Health" className="mt-1" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input value={ma.plan} onChange={(e) => setMa({ ...ma, plan: e.target.value })} placeholder="e.g. Comprehensive" className="mt-1" />
                </div>
                <div>
                  <Label>Member Number</Label>
                  <Input value={ma.memberNumber} onChange={(e) => setMa({ ...ma, memberNumber: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Principal Member</Label>
                  <Input value={ma.principalMember} onChange={(e) => setMa({ ...ma, principalMember: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Auth Line</Label>
                  <Input value={ma.authLine} onChange={(e) => setMa({ ...ma, authLine: e.target.value })} placeholder="Pre-auth phone number" className="mt-1" />
                </div>
                <div>
                  <Label>Emergency Line</Label>
                  <Input value={ma.emergencyLine} onChange={(e) => setMa({ ...ma, emergencyLine: e.target.value })} placeholder="24hr emergency line" className="mt-1" />
                </div>
              </div>
              <Button className="mt-4" onClick={saveMedAid}>Save Medical Aid</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Readings tab */}
        <TabsContent value="readings">
          <div className="mb-3 flex justify-end">
            <Dialog open={readingOpen} onOpenChange={setReadingOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Log Reading</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Log Health Reading</DialogTitle></DialogHeader>
                <ReadingFormContent
                  form={readingForm}
                  setForm={setReadingForm}
                  onSave={addReading}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="pt-4">
              {readings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No readings logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...readings]
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((r) => {
                          const typeInfo = READING_TYPES.find((t) => t.value === r.type);
                          const val = r.value2 ? `${r.value}/${r.value2}` : String(r.value);
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs whitespace-nowrap">{r.date}{r.time ? ` ${r.time}` : ""}</TableCell>
                              <TableCell className="text-xs">{typeInfo?.label ?? r.type}</TableCell>
                              <TableCell className="text-xs font-mono font-semibold">{val} {r.unit}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{r.notes}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteReading(r.id)}>×</Button>
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
        </TabsContent>

        {/* Emergency tab */}
        <TabsContent value="emergency">
          <div className="mb-3 flex justify-end">
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Contact</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Emergency Contact</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-3 pt-1">
                  <div>
                    <Label>Name *</Label>
                    <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="mt-1" autoFocus />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} placeholder="e.g. Spouse, Parent" className="mt-1" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1" />
                  </div>
                  <Button onClick={addContact} disabled={!contactForm.name.trim()}>Add Contact</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-red-600 flex items-center gap-2">
                <Phone className="h-4 w-4" /> Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No emergency contacts added.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{c.name}</p>
                        {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
                        {c.phone && (
                          <p className="text-sm font-mono font-medium text-red-700 mt-1">{c.phone}</p>
                        )}
                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteContact(c.id)}>×</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick profile summary card */}
          {(profile.bloodType || (profile.conditions ?? []).length > 0 || (profile.allergies ?? []).length > 0) && (
            <Card className="mt-4 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-orange-700">Medical Summary Card</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {profile.bloodType && (
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Blood type</span>
                    <Badge variant="outline">{profile.bloodType}</Badge>
                  </div>
                )}
                {(profile.conditions ?? []).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Conditions</span>
                    <div className="flex flex-wrap gap-1">
                      {(profile.conditions ?? []).map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                )}
                {(profile.allergies ?? []).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">Allergies</span>
                    <div className="flex flex-wrap gap-1">
                      {(profile.allergies ?? []).map((a) => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ReadingFormContentProps {
  form: ReadingForm;
  setForm: (f: ReadingForm) => void;
  onSave: () => void;
}

function ReadingFormContent({ form, setForm, onSave }: ReadingFormContentProps) {
  const typeInfo = READING_TYPES.find((t) => t.value === form.type);
  const isBP = form.type === "bp";

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div>
        <Label>Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) => {
            const info = READING_TYPES.find((t) => t.value === v);
            setForm({ ...form, type: v as HealthReadingType, unit: info?.unit ?? "" });
          }}
        >
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {READING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{isBP ? "Systolic" : "Value"} *</Label>
          <Input
            type="number"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder={typeInfo?.unit}
            className="mt-1"
          />
        </div>
        {isBP ? (
          <div>
            <Label>Diastolic</Label>
            <Input type="number" value={form.value2} onChange={(e) => setForm({ ...form, value2: e.target.value })} className="mt-1" />
          </div>
        ) : (
          <div>
            <Label>Unit</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Time</Label>
          <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="mt-1" />
      </div>
      <Button onClick={onSave} disabled={!form.value || !form.date}>Log Reading</Button>
    </div>
  );
}

export default PersonalHealth;
