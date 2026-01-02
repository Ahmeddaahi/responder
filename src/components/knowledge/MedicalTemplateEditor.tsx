
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
    Stethoscope,
    Users,
    Settings2,
    AlertTriangle,
    Plus,
    Trash2,
    Save,
    Clock,
    Globe,
    Bell
} from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

export interface Doctor {
    id: string;
    name: string;
    department: string;
    type: string;
    languages: string;
    duration: string;
    max_patients: string;
    status: string;
}

export interface MedicalConfig {
    doctors: Doctor[];
    booking_rules: {
        one_per_day: boolean;
        same_day_allowed: boolean;
        booking_closure_hours: number;
        max_advance_days: number;
        auto_assign_doctor: boolean;
    };
    emergency_keywords: string[];
    emergency_message: string;
    notifications: {
        whatsapp_confirmation: boolean;
        appointment_summary: boolean;
        reminder_24h: boolean;
    };
    legal_notice: string;
}

interface MedicalTemplateEditorProps {
    value: MedicalConfig;
    onChange: (value: MedicalConfig) => void;
}

const MedicalTemplateEditor: React.FC<MedicalTemplateEditorProps> = ({ value, onChange }) => {
    const [isAddingDoctor, setIsAddingDoctor] = useState(false);
    const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
        name: "",
        department: "",
        type: "In-person",
        languages: "Somali, English",
        duration: "30",
        max_patients: "10",
        status: "Active"
    });

    const updateDoctor = (id: string, updates: Partial<Doctor>) => {
        const updatedDoctors = value.doctors.map(d => d.id === id ? { ...d, ...updates } : d);
        onChange({ ...value, doctors: updatedDoctors });
    };

    const addDoctor = () => {
        if (!newDoctor.name) return;
        const doctor: Doctor = {
            id: `dr_${Date.now()}`,
            name: newDoctor.name!,
            department: newDoctor.department || "General",
            type: newDoctor.type || "In-person",
            languages: newDoctor.languages || "Somali, English",
            duration: newDoctor.duration || "30",
            max_patients: newDoctor.max_patients || "10",
            status: "Active",
            ...newDoctor
        };
        onChange({ ...value, doctors: [...value.doctors, doctor] });
        setNewDoctor({
            name: "",
            department: "",
            type: "In-person",
            languages: "Somali, English",
            duration: "30",
            max_patients: "10",
            status: "Active"
        });
        setIsAddingDoctor(false);
    };

    const removeDoctor = (id: string) => {
        onChange({ ...value, doctors: value.doctors.filter(d => d.id !== id) });
    };

    const updateRules = (updates: Partial<MedicalConfig['booking_rules']>) => {
        onChange({ ...value, booking_rules: { ...value.booking_rules, ...updates } });
    };

    const updateNotifications = (updates: Partial<MedicalConfig['notifications']>) => {
        onChange({ ...value, notifications: { ...value.notifications, ...updates } });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Medical Center Configuration</h3>
                    <p className="text-xs text-muted-foreground">Customize your clinical booking workflow and medical staff.</p>
                </div>
            </div>

            <Tabs defaultValue="doctors" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="doctors" className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Doctors
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" /> Procedures
                    </TabsTrigger>
                    <TabsTrigger value="emergency" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Emergency
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="doctors" className="space-y-4">
                    <Card className="p-1">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Doctor Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {value.doctors.map((doctor) => (
                                    <TableRow key={doctor.id}>
                                        <TableCell className="font-medium">{doctor.name}</TableCell>
                                        <TableCell>{doctor.department}</TableCell>
                                        <TableCell>{doctor.duration} min</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDoctor(doctor.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {value.doctors.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                            No doctors configured yet. Add your first medical staff.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    <Dialog open={isAddingDoctor} onOpenChange={setIsAddingDoctor}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                                <Plus className="w-4 h-4 mr-2" /> Add New Doctor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Medical Staff</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={newDoctor.name}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                        placeholder="e.g. Dr. Ahmed Ali"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dept">Department / Specialty</Label>
                                    <Input
                                        id="dept"
                                        value={newDoctor.department}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                                        placeholder="e.g. General, Pediatrics"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Slot Duration (min)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={newDoctor.duration}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, duration: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Session Type</Label>
                                        <Input
                                            id="type"
                                            value={newDoctor.type}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, type: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="langs">Languages Spoken</Label>
                                    <Input
                                        id="langs"
                                        value={newDoctor.languages}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, languages: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={addDoctor} className="bg-emerald-500 hover:bg-emerald-600 w-full">Save Doctor</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="rules" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Booking Limits</h4>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>One booking per day</Label>
                                    <p className="text-[10px] text-muted-foreground">Limit patient to 1 slot per 24h</p>
                                </div>
                                <Switch
                                    checked={value.booking_rules.one_per_day}
                                    onCheckedChange={(val) => updateRules({ one_per_day: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Same day booking</Label>
                                    <p className="text-[10px] text-muted-foreground">Allow booking for today</p>
                                </div>
                                <Switch
                                    checked={value.booking_rules.same_day_allowed}
                                    onCheckedChange={(val) => updateRules({ same_day_allowed: val })}
                                />
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-xs">Max Advance Booking (Days)</Label>
                                <Input
                                    type="number"
                                    value={value.booking_rules.max_advance_days}
                                    onChange={(e) => updateRules({ max_advance_days: parseInt(e.target.value) })}
                                />
                            </div>
                        </Card>

                        <Card className="p-4 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-4 h-4 text-primary" />
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Notifications</h4>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>WhatsApp Confirmation</Label>
                                    <p className="text-[10px] text-muted-foreground">Send auto-reply on booking</p>
                                </div>
                                <Switch
                                    checked={value.notifications.whatsapp_confirmation}
                                    onCheckedChange={(val) => updateNotifications({ whatsapp_confirmation: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>24h Reminders</Label>
                                    <p className="text-[10px] text-muted-foreground">Follow up before appointment</p>
                                </div>
                                <Switch
                                    checked={value.notifications.reminder_24h}
                                    onCheckedChange={(val) => updateNotifications({ reminder_24h: val })}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" /> Legal Notice / Consent
                        </Label>
                        <Textarea
                            placeholder="e.g. This is not a diagnosis tool..."
                            value={value.legal_notice}
                            onChange={(e) => onChange({ ...value, legal_notice: e.target.value })}
                            className="text-xs h-20"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="emergency" className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800">Critical: AI Triage Rules</h4>
                            <p className="text-xs text-amber-700 mt-1">
                                If the AI detects these keywords, it will stop the booking and show your emergency message.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Emergency Keywords (Comma separated)</Label>
                        <Input
                            value={value.emergency_keywords.join(", ")}
                            onChange={(e) => onChange({ ...value, emergency_keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) })}
                            placeholder="bleeding, chest pain, accident, degdeg..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Emergency Response Message</Label>
                        <Textarea
                            value={value.emergency_message}
                            onChange={(e) => onChange({ ...value, emergency_message: e.target.value })}
                            className="h-28 text-sm"
                            placeholder="What should the AI say in an emergency?"
                        />
                        <p className="text-[10px] text-muted-foreground">Use {"{{emergency_phone}}"} to insert your contact number.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MedicalTemplateEditor;
