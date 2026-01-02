
import React, { useState, useEffect } from 'react';
import { format, addMinutes, startOfDay, parseISO, isSameDay } from 'date-fns';
import {
    Calendar as CalendarIcon,
    Clock,
    RefreshCw,
    User,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Plus,
    UserCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Doctor } from './MedicalTemplateEditor';

interface Slot {
    id: string;
    doctor_id: string;
    slot_date: string;
    slot_time: string;
    status: 'available' | 'booked' | 'blocked';
    patient_info?: string;
    booking_id?: string;
}

interface DoctorSlotsManagerProps {
    doctors: Doctor[];
    userId: string;
}

interface DoctorConfig {
    startHour: string;
    startMin: string;
    startPeriod: 'AM' | 'PM';
    endHour: string;
    endMin: string;
    endPeriod: 'AM' | 'PM';
    slotDuration: string;
}

const DoctorSlotsManager: React.FC<DoctorSlotsManagerProps> = ({ doctors, userId }) => {
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || "");
    const [date, setDate] = useState<Date>(new Date());
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Per-doctor configuration state
    const [doctorConfigs, setDoctorConfigs] = useState<Record<string, DoctorConfig>>({});

    const currentConfig: DoctorConfig = doctorConfigs[selectedDoctorId] || {
        startHour: "09",
        startMin: "00",
        startPeriod: "AM",
        endHour: "05",
        endMin: "00",
        endPeriod: "PM",
        slotDuration: "30"
    };

    const updateConfig = (updates: Partial<DoctorConfig>) => {
        setDoctorConfigs(prev => ({
            ...prev,
            [selectedDoctorId]: { ...currentConfig, ...updates }
        }));
    };

    const { toast } = useToast();

    useEffect(() => {
        if (selectedDoctorId && date) {
            fetchSlots();
        }
    }, [selectedDoctorId, date]);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const { data, error } = await (supabase
                .from('doctor_slots' as any)
                .select('*')
                .eq('doctor_id', selectedDoctorId)
                .eq('slot_date', formattedDate)
                .order('slot_time', { ascending: true }) as any);

            if (error) throw error;
            setSlots((data as any) || []);
        } catch (error: any) {
            toast({
                title: "Error fetching slots",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const convertTo24h = (hour: string, min: string, period: 'AM' | 'PM') => {
        let h = parseInt(hour);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${min}:00`;
    };

    const generateSlots = async () => {
        if (!selectedDoctorId) return;
        setIsGenerating(true);
        try {
            const doctor = doctors.find(d => d.id === selectedDoctorId);
            if (!doctor) return;

            const formattedDate = format(date, 'yyyy-MM-dd');
            const startTimeStr = convertTo24h(currentConfig.startHour, currentConfig.startMin, currentConfig.startPeriod);
            const endTimeStr = convertTo24h(currentConfig.endHour, currentConfig.endMin, currentConfig.endPeriod);
            const duration = parseInt(currentConfig.slotDuration);

            const startTime = new Date(`${formattedDate}T${startTimeStr}`);
            const endTime = new Date(`${formattedDate}T${endTimeStr}`);

            const newSlots: Omit<Slot, 'id'>[] = [];
            let current = startTime;

            while (current < endTime) {
                newSlots.push({
                    doctor_id: selectedDoctorId,
                    slot_date: formattedDate,
                    slot_time: format(current, 'HH:mm:ss'),
                    status: 'available',
                });
                current = addMinutes(current, duration);
            }

            // Bulk insert ignoring duplicates
            const { error } = await (supabase
                .from('doctor_slots' as any)
                .upsert(
                    newSlots.map(s => ({ ...s, user_id: userId })),
                    { onConflict: 'doctor_id,slot_date,slot_time' }) as any
            );

            if (error) throw error;

            toast({
                title: "Slots Generated",
                description: `Created schedule for ${doctor.name} on ${formattedDate}`,
            });
            fetchSlots();
        } catch (error: any) {
            toast({
                title: "Generation failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const updateSlotStatus = async (slot: Slot, newStatus: 'available' | 'booked' | 'blocked', patientInfo?: string) => {
        try {
            const { error } = await (supabase
                .from('doctor_slots' as any)
                .upsert({
                    ...slot,
                    user_id: userId,
                    status: newStatus,
                    patient_info: patientInfo || slot.patient_info,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'doctor_id,slot_date,slot_time' }) as any);

            if (error) throw error;
            fetchSlots();
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="p-4 sm:p-6 bg-card border-border shadow-md">
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Time Availability Manager
                        </h3>
                        <p className="text-xs text-muted-foreground">Manage walk-ins and online bookings from one place.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                    <CalendarIcon className="w-4 h-4" />
                                    {format(date, "PPP")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            onClick={generateSlots}
                            disabled={isGenerating || !selectedDoctorId}
                            size="sm"
                            className="h-9 bg-primary hover:bg-primary/90"
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                            Generate Slots
                        </Button>
                    </div>
                </div>

                {/* Slot Generation Header Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift Start</Label>
                        <div className="flex items-center gap-2">
                            <select
                                value={currentConfig.startHour}
                                onChange={(e) => updateConfig({ startHour: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i} value={(i + 1).toString().padStart(2, '0')}>{(i + 1).toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <span className="font-bold">:</span>
                            <select
                                value={currentConfig.startMin}
                                onChange={(e) => updateConfig({ startMin: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {["00", "15", "30", "45"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={currentConfig.startPeriod}
                                onChange={(e) => updateConfig({ startPeriod: e.target.value as 'AM' | 'PM' })}
                                className="h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shift End</Label>
                        <div className="flex items-center gap-2">
                            <select
                                value={currentConfig.endHour}
                                onChange={(e) => updateConfig({ endHour: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {[...Array(12)].map((_, i) => (
                                    <option key={i} value={(i + 1).toString().padStart(2, '0')}>{(i + 1).toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                            <span className="font-bold">:</span>
                            <select
                                value={currentConfig.endMin}
                                onChange={(e) => updateConfig({ endMin: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {["00", "15", "30", "45"].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={currentConfig.endPeriod}
                                onChange={(e) => updateConfig({ endPeriod: e.target.value as 'AM' | 'PM' })}
                                className="h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slot Duration</Label>
                        <div className="flex items-center gap-2">
                            <select
                                value={currentConfig.slotDuration}
                                onChange={(e) => updateConfig({ slotDuration: e.target.value })}
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {[10, 15, 20, 30, 45, 60, 90, 120, 180].map(d => (
                                    <option key={d} value={d.toString()}>{d}</option>
                                ))}
                            </select>
                            <span className="text-xs text-muted-foreground ml-1 font-medium italic">Minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b border-border/50">
                {doctors.map((doctor) => (
                    <Button
                        key={doctor.id}
                        variant={selectedDoctorId === doctor.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className="shrink-0 h-8 gap-2"
                    >
                        <User className="w-3.5 h-3.5" />
                        {doctor.name}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {slots.map((slot) => (
                    <SlotItem
                        key={slot.id}
                        slot={slot}
                        onStatusChange={updateSlotStatus}
                    />
                ))}
            </div>

            {!loading && slots.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/10">
                    <UserCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">No slots generated for this date.</p>
                </div>
            )}
        </Card>
    );
};

const SlotItem = ({ slot, onStatusChange }: {
    slot: Slot,
    onStatusChange: (slot: Slot, status: 'available' | 'booked' | 'blocked', info?: string) => void
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [patientInfo, setPatientInfo] = useState(slot.patient_info || "");

    const timeStr = slot.slot_time.substring(0, 5);

    // Status styles
    const statusStyles = {
        available: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        booked: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer",
        blocked: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
    };

    return (
        <>
            <div
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95",
                    statusStyles[slot.status]
                )}
            >
                {timeStr}
                {slot.status === 'booked' && <span className="text-[8px] opacity-70 mt-0.5 truncate max-w-full px-1">{slot.patient_info || 'Booked'}</span>}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Manage Slot: {timeStr}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    size="sm"
                                    variant={slot.status === 'available' ? 'default' : 'outline'}
                                    onClick={() => onStatusChange(slot, 'available')}
                                    className="gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Available
                                </Button>
                                <Button
                                    size="sm"
                                    variant={slot.status === 'booked' ? 'default' : 'outline'}
                                    onClick={() => onStatusChange(slot, 'booked', patientInfo)}
                                    className="gap-2"
                                >
                                    <XCircle className="w-4 h-4" /> Booked
                                </Button>
                                <Button
                                    size="sm"
                                    variant={slot.status === 'blocked' ? 'default' : 'outline'}
                                    onClick={() => onStatusChange(slot, 'blocked')}
                                    className="gap-2"
                                >
                                    <MinusCircle className="w-4 h-4" /> Blocked
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="patient_info">Patient Info (Name/Phone)</Label>
                            <Input
                                id="patient_info"
                                value={patientInfo}
                                onChange={(e) => setPatientInfo(e.target.value)}
                                placeholder="Walk-in patient details"
                            />
                        </div>

                        {slot.booking_id && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                                <p className="font-bold text-primary mb-1">Online Booking Details</p>
                                <p>Booking ID: {slot.booking_id}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => {
                            if (slot.status === 'booked') {
                                onStatusChange(slot, 'booked', patientInfo);
                            }
                            setIsDialogOpen(false);
                        }} className="w-full">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DoctorSlotsManager;
