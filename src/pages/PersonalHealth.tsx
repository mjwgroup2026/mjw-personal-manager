import { useState } from "react";
import { usePersonalData } from "@/hooks/usePersonalData";
import type { HealthReading, HealthReadingType, EmergencyContact } from "@/lib/personal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Heart, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

const readingTypes: { value: HealthReadingType; label: string; unit: string }[] = [
  { value: "blood_sugar", label: "Blood Sugar", unit: "mmol/L" },
  { value: "bp", label: "Blood Pressure", unit: "mmHg" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "hba1c", label: "HbA1c", unit: "%" },
  { value: "cholesterol", label: "Cholesterol", unit: "mmol/L" },
  { value: "sleep", label: "Sleep", unit: "hrs" },
];

export default function PersonalHealth() {
  const { health, setHealth } = usePersonalData();
  const [tab, setTab] = useState<"profile" | "medaid" | "readings" | "emergency">("profile");
  const [readingOpen, setReadingOpen] = useState(false);
  const [rType, setRType] = useState<HealthReadingType>("blood_sugar");
  const [rValue, setRValue] = useState("");
  const [rValue2, setRValue2] = useState("");
  const [rDate, setRDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [ecOpen, setEcOpen] = useState(false);
  const [ecForm, setEcForm] = useState<Partial<EmergencyContact>>({});

  const updateProfile = (key: string, val: string) => setHealth((h) => ({ ...h, profile: { ...h.profile, [key]: val } }));
  const updateMedAid = (key: string, val: string) => setHealth((h) => ({ ...h, medicalAid: { ...h.medicalAid, [key]: val } }));

  const addReading = () => {
    if (!rValue) return;
    const r: HealthReading = {
      id: crypto.randomUUID(), type: rType, value: parseFloat(rValue),
      value2: rValue2 ? parseFloat(rValue2) : undefined,
      unit: readingTypes.find((t) => t.value === rType)?.unit,
      date: rDate, createdAt: new Date().toISOString(),
    };
    setHealth((h) => ({ ...h, readings: [r, ...h.readings] }));
    setReadingOpen(false); setRValue(""); setRValue2("");
  };

  const removeReading = (id: string) => setHealth((h) => ({ ...h, readings: h.readings.filter((r) => r.id !== id) }));

  const addEc = () => {
    if (!ecForm.name?.trim()) return;
    const ec: EmergencyContact = { id: crypto.randomUUID(), name: ecForm.name, relationship: ecForm.relationship, phone: ecForm.phone, email: ecForm.email };
    setHealth((h) => ({ ...h, emergencyContacts: [...h.emergencyContacts, ec] }));
    setEcOpen(false); setEcForm({});
  };
  const removeEc = (id: string) => setHealth((h) => ({ ...h, emergencyContacts: h.emergencyContacts.filter((e) => e.id !== id) }));

  const tabs = [{ key: "profile", label: "Profile" }, { key: "medaid", label: "Medical Aid" }, { key: "readings", label: "Readings" }, { key: "emergency", label: "Emergency" }] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold font-display flex items-center gap-2 mb-5"><Heart className="h-6 w-6 text-red-500" />Health</h1>
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <Card><CardContent className="py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[["fullName","Full Name"],["dateOfBirth","Date of Birth"],["idNumber","ID Number"],["gender","Gender"],["bloodType","Blood Type"]].map(([key, label]) => (
              <div key={key}>
                <Label className="font-body text-xs mb-1 block">{label}</Label>
                <Input value={(health.profile as any)[key] ?? ""} onChange={(e) => updateProfile(key, e.target.value)} className="font-body text-sm" placeholder={label} />
              </div>
            ))}
          </div>
          <div>
            <Label className="font-body text-xs mb-1 block">Conditions (comma separated)</Label>
            <Input value={health.profile.conditions?.join(", ") ?? ""} onChange={(e) => setHealth((h) => ({ ...h, profile: { ...h.profile, conditions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } }))} className="font-body text-sm" placeholder="e.g. Diabetes, Hypertension" />
          </div>
          <div>
            <Label className="font-body text-xs mb-1 block">Allergies (comma separated)</Label>
            <Input value={health.profile.allergies?.join(", ") ?? ""} onChange={(e) => setHealth((h) => ({ ...h, profile: { ...h.profile, allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } }))} className="font-body text-sm" placeholder="e.g. Penicillin, Peanuts" />
          </div>
          <p className="text-[11px] text-muted-foreground font-body">Changes are saved automatically to your local device.</p>
        </CardContent></Card>
      )}

      {tab === "medaid" && (
        <Card><CardContent className="py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[["scheme","Scheme Name"],["plan","Plan"],["memberNumber","Member Number"],["principalMember","Principal Member"],["authLine","Auth Line"],["emergencyLine","Emergency Line"]].map(([key, label]) => (
              <div key={key}>
                <Label className="font-body text-xs mb-1 block">{label}</Label>
                <Input value={(health.medicalAid as any)[key] ?? ""} onChange={(e) => updateMedAid(key, e.target.value)} className="font-body text-sm" placeholder={label} />
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {tab === "readings" && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => setReadingOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Log Reading
            </Button>
          </div>
          <div className="space-y-2">
            {health.readings.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-8">No readings logged yet.</p>}
            {health.readings.map((r) => {
              const t = readingTypes.find((x) => x.value === r.type);
              return (
                <Card key={r.id}>
                  <CardContent className="py-2.5 px-4 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-accent shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold font-body text-foreground">{t?.label ?? r.type}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{format(parseISO(r.date), "d MMM yyyy")}</p>
                    </div>
                    <span className="text-sm font-bold font-body text-foreground">
                      {r.value}{r.value2 ? `/${r.value2}` : ""} <span className="text-xs font-normal text-muted-foreground">{t?.unit}</span>
                    </span>
                    <button onClick={() => removeReading(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Dialog open={readingOpen} onOpenChange={setReadingOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Log Health Reading</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="font-body text-xs mb-1 block">Type</Label>
                  <Select value={rType} onValueChange={(v) => setRType(v as HealthReadingType)}>
                    <SelectTrigger className="font-body text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{readingTypes.map((t) => <SelectItem key={t.value} value={t.value} className="font-body">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-body text-xs mb-1 block">Value {rType === "bp" ? "(Systolic)" : ""}</Label>
                    <Input type="number" step="0.1" value={rValue} onChange={(e) => setRValue(e.target.value)} className="font-body" />
                  </div>
                  {rType === "bp" && (
                    <div>
                      <Label className="font-body text-xs mb-1 block">Diastolic</Label>
                      <Input type="number" value={rValue2} onChange={(e) => setRValue2(e.target.value)} className="font-body" />
                    </div>
                  )}
                  <div>
                    <Label className="font-body text-xs mb-1 block">Date</Label>
                    <Input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} className="font-body" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={addReading} className="flex-1 bg-primary text-primary-foreground font-body">Log Reading</Button>
                  <Button variant="outline" onClick={() => setReadingOpen(false)} className="font-body">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {tab === "emergency" && (
        <div>
          <div className="flex justify-end mb-3">
            <Button size="sm" className="bg-primary text-primary-foreground font-body" onClick={() => { setEcForm({}); setEcOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          </div>
          <div className="space-y-2">
            {health.emergencyContacts.length === 0 && <p className="text-sm text-muted-foreground font-body text-center py-8">No emergency contacts added.</p>}
            {health.emergencyContacts.map((ec) => (
              <Card key={ec.id}>
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold font-body">{ec.name}</p>
                    {ec.relationship && <p className="text-[11px] text-muted-foreground font-body">{ec.relationship}</p>}
                    {ec.phone && <p className="text-[11px] text-muted-foreground font-body">{ec.phone}</p>}
                  </div>
                  <button onClick={() => removeEc(ec.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Dialog open={ecOpen} onOpenChange={setEcOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Emergency Contact</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label className="font-body text-xs mb-1 block">Name *</Label><Input value={ecForm.name ?? ""} onChange={(e) => setEcForm((f) => ({ ...f, name: e.target.value }))} className="font-body" /></div>
                <div><Label className="font-body text-xs mb-1 block">Relationship</Label><Input value={ecForm.relationship ?? ""} onChange={(e) => setEcForm((f) => ({ ...f, relationship: e.target.value }))} className="font-body" /></div>
                <div><Label className="font-body text-xs mb-1 block">Phone</Label><Input value={ecForm.phone ?? ""} onChange={(e) => setEcForm((f) => ({ ...f, phone: e.target.value }))} className="font-body" /></div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={addEc} className="flex-1 bg-primary text-primary-foreground font-body">Add Contact</Button>
                  <Button variant="outline" onClick={() => setEcOpen(false)} className="font-body">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
