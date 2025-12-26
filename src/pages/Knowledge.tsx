import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Hotel,
  UtensilsCrossed,
  Stethoscope,
  Plus,
  Languages,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import OpeningHoursEditor from "@/components/knowledge/OpeningHoursEditor";
import BookingFlowEditor, { BookingField } from "@/components/knowledge/BookingFlowEditor";
import RoomTypesEditor, { RoomType } from "@/components/knowledge/RoomTypesEditor";

type BusinessType = "hotel" | "restaurant" | "hospital" | "custom";

interface BookingConfiguration {
  id?: string;
  business_type: BusinessType;
  is_active: boolean;
  // Common
  require_customer_name: boolean;
  require_customer_phone: boolean;
  require_customer_email: boolean;
  // Hotel
  require_check_in_date: boolean;
  require_check_out_date: boolean;
  require_room_type: boolean;
  require_number_of_guests: boolean;
  hotel_rooms_available: string;
  // Restaurant
  require_reservation_date: boolean;
  require_reservation_time: boolean;
  require_number_of_people: boolean;
  require_table_preference: boolean;
  require_special_requests: boolean;
  restaurant_opening_hours: string;
  // Hospital
  require_appointment_date: boolean;
  require_appointment_time: boolean;
  require_department: boolean;
  require_doctor_name: boolean;
  require_reason_for_visit: boolean;
  hospital_departments: string;
  // Custom / advanced
  custom_fields: string;
  field_configs: BookingField[];
  business_name: string;
  ai_instructions: string;
  language: "so" | "en";
  currency: string;
}

const DEFAULT_CONFIG: Omit<BookingConfiguration, "business_type"> = {
  is_active: true,
  // Common
  require_customer_name: true,
  require_customer_phone: true,
  require_customer_email: false,
  // Hotel
  require_check_in_date: true,
  require_check_out_date: true,
  require_room_type: false,
  require_number_of_guests: true,
  hotel_rooms_available: "",
  // Restaurant
  require_reservation_date: true,
  require_reservation_time: true,
  require_number_of_people: true,
  require_table_preference: false,
  require_special_requests: false,
  restaurant_opening_hours: "",
  // Hospital
  require_appointment_date: true,
  require_appointment_time: true,
  require_department: true,
  require_doctor_name: false,
  require_reason_for_visit: true,
  hospital_departments: "",
  // Custom / advanced
  custom_fields: "[]",
  field_configs: [],
  business_name: "",
  ai_instructions: "",
  language: "so",
  currency: "ETB",
};

const DEFAULT_FIELDS_MAP: Record<string, BookingField[]> = {
  hotel: [
    { id: 'customer_name', label: 'Guest Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
    { id: 'check_in_date', label: 'Check-in Date', required: true, type: 'date', is_core: true },
    { id: 'check_out_date', label: 'Check-out Date', required: true, type: 'date', is_core: true },
    { id: 'number_of_guests', label: 'Number of Guests', required: true, type: 'number', is_core: true },
    { id: 'room_type', label: 'Room Type', required: false, type: 'text', is_core: true },
  ],
  restaurant: [
    { id: 'customer_name', label: 'Guest Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
    { id: 'reservation_date', label: 'Reservation Date', required: true, type: 'date', is_core: true },
    { id: 'reservation_time', label: 'Reservation Time', required: true, type: 'time', is_core: true },
    { id: 'number_of_people', label: 'Number of People', required: true, type: 'number', is_core: true },
    { id: 'table_preference', label: 'Table Preference', required: false, type: 'text', is_core: true },
  ],
  hospital: [
    { id: 'customer_name', label: 'Patient Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
    { id: 'appointment_date', label: 'Appointment Date', required: true, type: 'date', is_core: true },
    { id: 'appointment_time', label: 'Appointment Time', required: true, type: 'time', is_core: true },
    { id: 'department', label: 'Department', required: true, type: 'text', is_core: true },
    { id: 'reason_for_visit', label: 'Reason for Visit', required: true, type: 'text', is_core: true },
  ],
  custom: [
    { id: 'customer_name', label: 'Customer Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
  ]
};

const Knowledge = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [knowledgeSaved, setKnowledgeSaved] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [config, setConfig] = useState<BookingConfiguration | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [roomTypesLimit, setRoomTypesLimit] = useState<number>(10);
  const [configsCount, setConfigsCount] = useState<number>(0);
  const [existingTypes, setExistingTypes] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (!session) {
      navigate("/auth");
    } else {
      // Fetch plan and limits
      try {
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('plan, room_types_limit')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (subError && subError.code === 'PGRST204') {
          // Column doesn't exist, fall back to just plan
          const { data: planOnly } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (planOnly) {
            setPlan(planOnly.plan);
            setRoomTypesLimit(planOnly.plan === 'free' ? 2 : 10);
          }
        } else if (subData) {
          const s = subData as any;
          setPlan(s.plan);
          setRoomTypesLimit(s.room_types_limit || (s.plan === 'free' ? 2 : 10));
        }
      } catch (err) {
        console.warn('Subscription limits fetch failed, using defaults', err);
      }

      // Fetch existing configs
      const { data: configs, count } = await supabase
        .from('booking_configurations')
        .select('business_type', { count: 'exact' })
        .eq('user_id', session.user.id);

      const countValue = count || 0;
      setConfigsCount(countValue);

      if (configs && configs.length > 0) {
        const types = configs.map(c => c.business_type);
        setExistingTypes(types);
      }
    }
  };

  const loadExistingConfig = async (businessType: BusinessType) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("booking_configurations")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_type", businessType)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const d = data as any;
        setConfig({
          id: d.id,
          business_type: d.business_type as BusinessType,
          is_active: d.is_active ?? true,
          require_customer_name: d.require_customer_name ?? true,
          require_customer_phone: d.require_customer_phone ?? true,
          require_customer_email: d.require_customer_email ?? false,
          require_check_in_date: d.require_check_in_date ?? true,
          require_check_out_date: d.require_check_out_date ?? true,
          require_room_type: d.require_room_type ?? false,
          require_number_of_guests: d.require_number_of_guests ?? true,
          hotel_rooms_available: d.hotel_rooms_available
            ? typeof d.hotel_rooms_available === 'string'
              ? d.hotel_rooms_available
              : JSON.stringify(d.hotel_rooms_available)
            : "[]",
          require_reservation_date: d.require_reservation_date ?? true,
          require_reservation_time: d.require_reservation_time ?? true,
          require_number_of_people: d.require_number_of_people ?? true,
          require_table_preference: d.require_table_preference ?? false,
          require_special_requests: d.require_special_requests ?? false,
          restaurant_opening_hours: d.restaurant_opening_hours
            ? typeof d.restaurant_opening_hours === 'string'
              ? d.restaurant_opening_hours
              : JSON.stringify(d.restaurant_opening_hours, null, 2)
            : "",
          require_appointment_date: d.require_appointment_date ?? true,
          require_appointment_time: d.require_appointment_time ?? true,
          require_department: d.require_department ?? true,
          require_doctor_name: d.require_doctor_name ?? false,
          require_reason_for_visit: d.require_reason_for_visit ?? true,
          hospital_departments: d.hospital_departments
            ? Array.isArray(d.hospital_departments)
              ? d.hospital_departments.join(", ")
              : typeof d.hospital_departments === 'string'
                ? d.hospital_departments
                : JSON.stringify(d.hospital_departments)
            : "",
          custom_fields: d.custom_fields
            ? typeof d.custom_fields === 'string'
              ? d.custom_fields
              : JSON.stringify(d.custom_fields, null, 2)
            : "[]",
          field_configs: (d.field_configs as BookingField[]) || DEFAULT_FIELDS_MAP[businessType] || [],
          business_name: d.business_name || "",
          ai_instructions: d.ai_instructions ?? "",
          language: (d.language as "so" | "en") || "so",
          currency: d.currency || "ETB",
        });
        setKnowledgeSaved(true);
      } else {
        setConfig({
          ...DEFAULT_CONFIG,
          business_type: businessType,
          field_configs: DEFAULT_FIELDS_MAP[businessType] || [],
        });
        setKnowledgeSaved(false);
      }
    } catch (error: any) {
      console.error("Error loading booking configuration:", error);
      toast({
        title: "Error",
        description: "Failed to load booking configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusinessType = (businessType: BusinessType) => {
    setSelectedBusinessType(businessType);
    loadExistingConfig(businessType);
  };

  const saveConfiguration = async () => {
    if (!user || !config || !selectedBusinessType) return;

    if (!config.business_name.trim()) {
      toast({
        title: "Business Name Required",
        description: "Please enter your business name to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Parse structured fields
      let hotelRooms: any = null;
      if (config.hotel_rooms_available.trim()) {
        try {
          // Try to parse as JSON first (new format)
          hotelRooms = JSON.parse(config.hotel_rooms_available);
          // Validate it's an array of room objects
          if (!Array.isArray(hotelRooms)) {
            throw new Error("Invalid format");
          }
        } catch {
          // Fallback to legacy comma-separated format
          hotelRooms = config.hotel_rooms_available
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
            .map((name) => ({ name, count: 0, available: true }));
        }
      }

      let departments: any = null;
      if (config.hospital_departments.trim()) {
        departments = config.hospital_departments
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
      }

      let openingHours: any = null;
      if (config.restaurant_opening_hours.trim()) {
        try {
          openingHours = JSON.parse(config.restaurant_opening_hours);
        } catch {
          toast({
            title: "Invalid Opening Hours",
            description: "Please provide valid JSON for restaurant opening hours.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      let customFields: any = null;
      if (config.custom_fields.trim()) {
        try {
          customFields = JSON.parse(config.custom_fields);
        } catch {
          toast({
            title: "Invalid Custom Fields",
            description: "Custom fields must be valid JSON.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const payload = {
        user_id: user.id,
        business_type: selectedBusinessType,
        is_active: config.is_active,
        business_name: config.business_name,
        field_configs: config.field_configs,
        ai_instructions: config.ai_instructions,
        hotel_rooms_available: hotelRooms,
        restaurant_opening_hours: openingHours,
        hospital_departments: departments,
        custom_fields: customFields,
        language: config.language,
        currency: config.currency,

        // Keep legacy flags in sync for backward compatibility
        require_customer_name: config.field_configs.find(f => f.id === 'customer_name')?.required ?? true,
        require_customer_phone: config.field_configs.find(f => f.id === 'customer_phone')?.required ?? true,
        require_customer_email: config.field_configs.find(f => f.id === 'customer_email')?.required ?? false,
        require_check_in_date: config.field_configs.find(f => f.id === 'check_in_date')?.required ?? true,
        require_check_out_date: config.field_configs.find(f => f.id === 'check_out_date')?.required ?? true,
        require_reservation_date: config.field_configs.find(f => f.id === 'reservation_date')?.required ?? true,
        require_reservation_time: config.field_configs.find(f => f.id === 'reservation_time')?.required ?? true,
        require_appointment_date: config.field_configs.find(f => f.id === 'appointment_date')?.required ?? true,
        require_appointment_time: config.field_configs.find(f => f.id === 'appointment_time')?.required ?? true,
      };

      let error;
      if (config.id) {
        ({ error } = await supabase
          .from("booking_configurations")
          .update(payload)
          .eq("id", config.id)
          .eq("user_id", user.id));
      } else {
        const { data, error: insertError } = await supabase
          .from("booking_configurations")
          .insert([payload])
          .select("id")
          .single();
        error = insertError;
        if (!insertError && data) {
          setConfig((prev) => (prev ? { ...prev, id: data.id } : prev));
        }
      }

      if (error) throw error;

      toast({
        title: "Booking Configuration Saved",
        description: "Your booking flow has been configured successfully.",
      });
      setKnowledgeSaved(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (knowledgeSaved) {
      navigate("/dashboard");
    } else {
      toast({
        title: "Configuration Required",
        description: "Please save your booking configuration before continuing.",
        variant: "destructive",
      });
    }
  };

  const syncConfigWithFields = (newFields: BookingField[]) => {
    if (!config) return;
    setConfig({ ...config, field_configs: newFields });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Configure Booking Assistant
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
              Provide your business name and customize the flow of questions for your AI assistant.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {!selectedBusinessType ? (
              <Card className="p-4 sm:p-5 md:p-6 bg-gradient-card border-border">
                <div className="flex flex-col gap-6">
                  <h3 className="text-lg sm:text-xl font-semibold">Select Business Type</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleSelectBusinessType("hotel")}
                      disabled={plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("hotel")}
                      className="disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow border-border cursor-pointer text-left h-full group-disabled:pointer-events-none">
                        <Hotel className="w-8 h-8 text-primary mb-3" />
                        <h4 className="font-semibold">Hotel</h4>
                        <p className="text-xs text-muted-foreground mt-1">Stays and room bookings</p>
                        {plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("hotel") && (
                          <div className="mt-2 text-[10px] text-amber-600 font-medium whitespace-nowrap">Business Plan Required</div>
                        )}
                      </Card>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectBusinessType("restaurant")}
                      disabled={plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("restaurant")}
                      className="disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow border-border cursor-pointer text-left h-full group-disabled:pointer-events-none">
                        <UtensilsCrossed className="w-8 h-8 text-accent mb-3" />
                        <h4 className="font-semibold">Restaurant</h4>
                        <p className="text-xs text-muted-foreground mt-1">Table reservations</p>
                        {plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("restaurant") && (
                          <div className="mt-2 text-[10px] text-amber-600 font-medium whitespace-nowrap">Business Plan Required</div>
                        )}
                      </Card>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectBusinessType("hospital")}
                      disabled={plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("hospital")}
                      className="disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow border-border cursor-pointer text-left h-full group-disabled:pointer-events-none">
                        <Stethoscope className="w-8 h-8 text-emerald-500 mb-3" />
                        <h4 className="font-semibold">Medical</h4>
                        <p className="text-xs text-muted-foreground mt-1">Clinics and appointments</p>
                        {plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("hospital") && (
                          <div className="mt-2 text-[10px] text-amber-600 font-medium whitespace-nowrap">Business Plan Required</div>
                        )}
                      </Card>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectBusinessType("custom")}
                      disabled={plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("custom")}
                      className="disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow border-dashed border-primary/50 cursor-pointer text-left h-full flex flex-col items-center justify-center text-center group-disabled:pointer-events-none">
                        <Plus className="w-8 h-8 text-primary mb-2" />
                        <h4 className="font-semibold">Custom</h4>
                        <p className="text-xs text-muted-foreground mt-1">Build from scratch</p>
                        {plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("custom") && (
                          <div className="mt-2 text-[10px] text-amber-600 font-medium whitespace-nowrap">Business Plan Required</div>
                        )}
                      </Card>
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              config && (
                <Card className="p-4 sm:p-5 md:p-6 bg-gradient-card border-border">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBusinessType(null)} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Badge variant={config.is_active ? "default" : "outline"}>
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="business_name">Business Name *</Label>
                          <Input
                            id="business_name"
                            placeholder="e.g. Grand Hotel"
                            value={config.business_name}
                            onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language" className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-primary" />
                            AI Assistant Language
                          </Label>
                          <Select
                            value={config.language}
                            onValueChange={(val: "so" | "en") => setConfig({ ...config, language: val })}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="so">Somali (SO)</SelectItem>
                              <SelectItem value="en">English (EN)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            The AI will respond strictly in this language, regardless of customer input.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={config.currency}
                            onValueChange={(val: string) => setConfig({ ...config, currency: val })}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                              <SelectItem value="SOS">SOS - Somali Shilling</SelectItem>
                              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                              <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Currency used for room prices and pricing information.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <BookingFlowEditor
                          fields={config.field_configs}
                          onChange={syncConfigWithFields}
                          isFreePlan={plan === 'free'}
                        />
                      </div>

                      {(selectedBusinessType === "hotel" || selectedBusinessType === "restaurant" || selectedBusinessType === "hospital") && (
                        <div className="bg-muted/30 p-4 rounded-lg border space-y-4 mt-4">
                          <h4 className="font-semibold text-sm capitalize">{selectedBusinessType} Template Settings</h4>

                          {selectedBusinessType === "hotel" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Available Room Types</Label>
                              <RoomTypesEditor
                                value={config.hotel_rooms_available || "[]"}
                                onChange={(val) => setConfig({ ...config, hotel_rooms_available: val })}
                                currency={config.currency}
                                limit={roomTypesLimit}
                              />
                            </div>
                          )}

                          {selectedBusinessType === "restaurant" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Opening hours</Label>
                              <OpeningHoursEditor
                                value={config.restaurant_opening_hours}
                                onChange={(val) => setConfig({ ...config, restaurant_opening_hours: val })}
                              />
                            </div>
                          )}

                          {selectedBusinessType === "hospital" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Available departments (comma separated)</Label>
                              <Input
                                placeholder="emergency, cardiology..."
                                value={config.hospital_departments}
                                onChange={(e) => setConfig({ ...config, hospital_departments: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 mt-4">
                        <Label>AI Booking Instructions</Label>
                        <Textarea
                          rows={4}
                          value={config.ai_instructions}
                          onChange={(e) => setConfig({ ...config, ai_instructions: e.target.value })}
                          placeholder="Extra rules for the AI..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <Button onClick={saveConfiguration} disabled={loading} className="bg-gradient-primary">
                        {knowledgeSaved ? "Update Flow" : "Save Flow"}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            )}

            <div className="text-center mt-8">
              <Button size="lg" onClick={handleContinue} className="bg-gradient-primary px-8">
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Knowledge;