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
import { Plus, Trash2, List } from "lucide-react";

interface CustomField {
    key: string;
    label: string;
    type: "text" | "number" | "date" | "boolean";
    required: boolean;
}

interface CustomFieldsEditorProps {
    value: string; // JSON string
    onChange: (value: string) => void;
}

const CustomFieldsEditor = ({ value, onChange }: CustomFieldsEditorProps) => {
    const [fields, setFields] = useState<CustomField[]>([]);

    useEffect(() => {
        try {
            if (value && value !== "[]") {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setFields(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to parse custom fields JSON", e);
        }
    }, []);

    const updateFields = (newFields: CustomField[]) => {
        setFields(newFields);
        onChange(JSON.stringify(newFields, null, 2));
    };

    const addField = () => {
        const newField: CustomField = {
            key: `field_${Date.now()}`,
            label: "",
            type: "text",
            required: false,
        };
        updateFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        updateFields(newFields);
    };

    const updateField = (index: number, updates: Partial<CustomField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        // Auto-update key based on label if key hasn't been manually set (simple heuristic)
        if (updates.label && newFields[index].key.startsWith("field_")) {
            newFields[index].key = updates.label
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "_");
        }
        updateFields(newFields);
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Custom Data Fields</h3>
                </div>
                <Button onClick={addField} size="sm" variant="outline" className="h-8">
                    <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
            </div>

            <div className="space-y-3">
                {fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-sm">No custom fields defined.</p>
                        <p className="text-xs mt-1">Add fields you want the AI to collect.</p>
                    </div>
                ) : (
                    fields.map((field, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-3 p-3 bg-muted/30 rounded-lg border group relative"
                        >
                            <div className="flex-1 min-w-0">
                                <Input
                                    placeholder="Question / Label (e.g. 'Allergies')"
                                    value={field.label}
                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                    className="bg-background h-9 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <div className="flex-1 sm:w-[110px]">
                                    <Select
                                        value={field.type}
                                        onValueChange={(val: any) => updateField(index, { type: val })}
                                    >
                                        <SelectTrigger className="bg-background h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="boolean">Yes/No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 sm:w-[100px]">
                                    <Select
                                        value={field.required ? "required" : "optional"}
                                        onValueChange={(val) =>
                                            updateField(index, { required: val === "required" })
                                        }
                                    >
                                        <SelectTrigger className="bg-background h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="optional">Optional</SelectItem>
                                            <SelectItem value="required">Required</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 bg-background/50 sm:bg-transparent"
                                    onClick={() => removeField(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomFieldsEditor;
