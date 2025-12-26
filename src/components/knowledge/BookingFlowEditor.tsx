import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface BookingField {
    id: string;
    label: string;
    type: "text" | "number" | "date" | "time" | "boolean" | "select";
    required: boolean;
    is_core?: boolean;
    options?: string; // Comma separated for select type
}

interface BookingFlowEditorProps {
    fields: BookingField[];
    onChange: (fields: BookingField[]) => void;
    isFreePlan?: boolean;
}

const BookingFlowEditor = ({ fields, onChange, isFreePlan = false }: BookingFlowEditorProps) => {
    const addField = () => {
        const newField: BookingField = {
            id: `custom_${Date.now()}`,
            label: "",
            type: "text",
            required: false,
        };
        onChange([...fields, newField]);
    };

    const removeField = (id: string) => {
        onChange(fields.filter((f) => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<BookingField>) => {
        onChange(
            fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
    };

    const moveField = (index: number, direction: "up" | "down") => {
        const newFields = [...fields];
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < fields.length) {
            const [moved] = newFields.splice(index, 1);
            newFields.splice(newIndex, 0, moved);
            onChange(newFields);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-sm sm:text-base">Booking Fields & Flow</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Customize the questions the AI asks and the order it asks them.
                    </p>
                </div>
                <Button
                    onClick={addField}
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={isFreePlan}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {isFreePlan ? 'Pro Feature' : 'Add Field'}
                </Button>
            </div>

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/30 rounded-lg border group relative animate-in fade-in slide-in-from-top-2"
                    >
                        <div className="flex items-center gap-2 sm:mr-2">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-background"
                                    onClick={() => moveField(index, "up")}
                                    disabled={index === 0}
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 hover:bg-background"
                                    onClick={() => moveField(index, "down")}
                                    disabled={index === fields.length - 1}
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Input
                                    placeholder="Enter field label (e.g. Check-in Date)"
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    className="bg-background h-9 text-sm"
                                />
                                {(!field.is_core || field.id === 'customer_email' || field.id === 'room_type' || field.id === 'table_preference' || field.id === 'special_requests' || field.id === 'doctor_name') && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => removeField(field.id)}
                                        title="Remove field"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="w-[120px]">
                                    <Select
                                        value={field.type}
                                        onValueChange={(val: any) => updateField(field.id, { type: val })}
                                        disabled={field.is_core && field.id.includes('date')} // Protect core date types
                                    >
                                        <SelectTrigger className="bg-background h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="time">Time</SelectItem>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                            <SelectItem value="select">Selection</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 px-2 h-8 rounded-md bg-background border border-border">
                                    <Checkbox
                                        id={`req-${field.id}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                                        disabled={field.id === 'customer_name' || field.id === 'customer_phone'}
                                    />
                                    <Label htmlFor={`req-${field.id}`} className="text-[10px] font-medium uppercase cursor-pointer">
                                        Required
                                    </Label>
                                </div>

                                {field.type === "select" && (
                                    <div className="flex-1 min-w-[150px]">
                                        <Input
                                            placeholder="Options (comma separated)"
                                            value={field.options || ""}
                                            onChange={(e) => updateField(field.id, { options: e.target.value })}
                                            className="bg-background h-8 text-xs"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-sm">No fields defined.</p>
                    <p className="text-xs mt-1">Add fields to start building your booking flow.</p>
                </div>
            )}
        </div>
    );
};

export default BookingFlowEditor;
