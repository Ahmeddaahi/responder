import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock } from "lucide-react";

interface OpeningHours {
    [key: string]: { open: string; close: string } | null;
}

interface OpeningHoursEditorProps {
    value: string; // JSON string
    onChange: (value: string) => void;
}

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const OpeningHoursEditor = ({ value, onChange }: OpeningHoursEditorProps) => {
    const [hours, setHours] = useState<OpeningHours>({});

    useEffect(() => {
        try {
            if (value) {
                setHours(JSON.parse(value));
            } else {
                // Initialize with default empty slots
                const defaultHours: OpeningHours = {};
                DAYS.forEach((day) => {
                    defaultHours[day] = null; // Closed by default
                });
                setHours(defaultHours);
            }
        } catch (e) {
            console.error("Failed to parse opening hours JSON", e);
            setHours({});
        }
    }, []);

    const updateHours = (newHours: OpeningHours) => {
        setHours(newHours);
        onChange(JSON.stringify(newHours, null, 2));
    };

    const handleDayToggle = (day: string, isOpen: boolean) => {
        const newHours = { ...hours };
        if (isOpen) {
            newHours[day] = { open: "09:00", close: "17:00" };
        } else {
            newHours[day] = null;
        }
        updateHours(newHours);
    };

    const handleTimeChange = (
        day: string,
        field: "open" | "close",
        time: string
    ) => {
        const newHours = { ...hours };
        if (newHours[day]) {
            newHours[day] = { ...newHours[day]!, [field]: time };
            updateHours(newHours);
        }
    };

    const copyToAllDays = (sourceDay: string) => {
        const sourceTime = hours[sourceDay];
        if (!sourceTime) return;

        const newHours = { ...hours };
        DAYS.forEach((day) => {
            if (day !== sourceDay) {
                newHours[day] = { ...sourceTime };
            }
        });
        updateHours(newHours);
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Weekly Schedule</h3>
            </div>

            <div className="grid gap-4">
                {DAYS.map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-3 min-w-[120px]">
                            <Switch
                                checked={!!hours[day]}
                                onCheckedChange={(checked) => handleDayToggle(day, checked)}
                            />
                            <Label className={`text-sm ${hours[day] ? "font-bold" : "text-muted-foreground outline-none"}`}>
                                {day}
                            </Label>
                        </div>

                        {hours[day] ? (
                            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 flex-1 w-full sm:w-auto">
                                <div className="flex items-center gap-2 w-full xs:w-auto">
                                    <Input
                                        type="time"
                                        value={hours[day]!.open}
                                        onChange={(e) => handleTimeChange(day, "open", e.target.value)}
                                        className="h-8 text-xs w-full xs:w-[100px]"
                                    />
                                    <span className="text-muted-foreground text-xs uppercase font-medium">to</span>
                                    <Input
                                        type="time"
                                        value={hours[day]!.close}
                                        onChange={(e) => handleTimeChange(day, "close", e.target.value)}
                                        className="h-8 text-xs w-full xs:w-[100px]"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-7 text-primary hover:text-primary hover:bg-primary/10 ml-auto sm:ml-2 font-bold px-2"
                                    onClick={() => copyToAllDays(day)}
                                >
                                    Apply to all days
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 text-xs text-muted-foreground/60 italic sm:text-right">
                                Closed
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OpeningHoursEditor;
