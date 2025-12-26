import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Bed } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface RoomType {
    name: string;
    count: number;
    available: boolean;
    price?: number;
}

interface RoomTypesEditorProps {
    value: string; // JSON string
    onChange: (value: string) => void;
    currency?: string; // Currency code (e.g., "ETB", "USD")
    limit?: number; // Maximum number of rooms allowed
}

const RoomTypesEditor = ({ value, onChange, currency = "ETB", limit = 10 }: RoomTypesEditorProps) => {
    const [rooms, setRooms] = useState<RoomType[]>([]);

    useEffect(() => {
        try {
            if (value) {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setRooms(parsed);
                } else {
                    // Handle legacy format (comma-separated string or old format)
                    setRooms([]);
                }
            } else {
                setRooms([]);
            }
        } catch (e) {
            console.error("Failed to parse room types JSON", e);
            setRooms([]);
        }
    }, [value]);

    const updateRooms = (newRooms: RoomType[]) => {
        setRooms(newRooms);
        onChange(JSON.stringify(newRooms));
    };

    const addRoom = () => {
        const newRoom: RoomType = {
            name: "",
            count: 1,
            available: true,
            price: 0,
        };
        updateRooms([...rooms, newRoom]);
    };

    const removeRoom = (index: number) => {
        const newRooms = rooms.filter((_, i) => i !== index);
        updateRooms(newRooms);
    };

    const updateRoom = (index: number, field: keyof RoomType, value: string | number | boolean) => {
        const newRooms = [...rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        updateRooms(newRooms);
    };

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Room Types & Availability</h3>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoom}
                    disabled={rooms.length >= limit}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {rooms.length >= limit ? `Limit ${limit} Reached` : 'Add Room Type'}
                </Button>
            </div>

            {rooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No room types added yet.</p>
                    <p className="text-xs mt-1">Click "Add Room Type" to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rooms.map((room, index) => (
                        <Card key={index} className="p-4 border bg-muted/20">
                            <div className="grid gap-4 md:grid-cols-12 items-start">
                                {/* Room Name */}
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor={`room-name-${index}`} className="text-xs">
                                        Room Name *
                                    </Label>
                                    <Input
                                        id={`room-name-${index}`}
                                        placeholder="e.g. Single, Double, Suite..."
                                        value={room.name}
                                        onChange={(e) => updateRoom(index, "name", e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                {/* Room Count */}
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor={`room-count-${index}`} className="text-xs">
                                        Total Rooms
                                    </Label>
                                    <Input
                                        id={`room-count-${index}`}
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={room.count}
                                        onChange={(e) => updateRoom(index, "count", parseInt(e.target.value) || 0)}
                                        className="h-9"
                                    />
                                </div>

                                {/* Room Price */}
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor={`room-price-${index}`} className="text-xs">
                                        Price
                                    </Label>
                                    <Input
                                        id={`room-price-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={room.price ?? ""}
                                        onChange={(e) => updateRoom(index, "price", parseFloat(e.target.value) || 0)}
                                        className="h-9"
                                    />
                                </div>

                                {/* Available Switch */}
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-xs block">Availability</Label>
                                    <div className="flex items-center gap-2 h-9">
                                        <Switch
                                            checked={room.available}
                                            onCheckedChange={(checked) => updateRoom(index, "available", checked)}
                                        />
                                        <span className={`text-xs ${room.available ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                                            {room.available ? "Available" : "Not Available"}
                                        </span>
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <div className="md:col-span-2 flex items-end justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRoom(index)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Room Status Display */}
                            {room.name && (
                                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    <span className="font-medium">{room.name}:</span>{" "}
                                    <span className={room.available && room.count > 0 ? "text-green-600" : "text-muted-foreground"}>
                                        {room.available && room.count > 0
                                            ? `${room.count} room${room.count !== 1 ? "s" : ""} available`
                                            : room.available
                                                ? "Available (0 rooms)"
                                                : "Not available for booking"}
                                    </span>
                                    {room.price && room.price > 0 && (
                                        <span className="ml-2 text-primary font-medium">
                                            • {room.price.toLocaleString()} {currency}
                                        </span>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
                💡 The AI will automatically check room availability and decrease the count when a booking is confirmed.
            </p>
        </div>
    );
};

export default RoomTypesEditor;
