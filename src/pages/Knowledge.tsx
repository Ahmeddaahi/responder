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
  ShoppingBag,
  BriefcaseBusiness,
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
import MedicalTemplateEditor, { MedicalConfig } from "@/components/knowledge/MedicalTemplateEditor";
import DoctorSlotsManager from "@/components/knowledge/DoctorSlotsManager";

type BusinessType = "hotel" | "business" | "hospital" | "custom";

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
  medical_config: MedicalConfig;
  business_name: string;
  ai_instructions: string;
  language: "so" | "en";
  currency: string;
  widget_color: string;
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
  medical_config: {
    doctors: [
      { id: "dr_a", name: "Dr. A", department: "General", type: "In-person", languages: "Somali, English", duration: "30", max_patients: "10", status: "Active" },
      { id: "dr_b", name: "Dr. B", department: "Pediatrics", type: "In-person", languages: "Somali", duration: "30", max_patients: "10", status: "Active" },
    ],
    booking_rules: { one_per_day: true, same_day_allowed: true, booking_closure_hours: 1, max_advance_days: 7, auto_assign_doctor: true },
    emergency_keywords: ["emergency", "bleeding", "severe pain", "accident", "unconscious", "degdeg"],
    emergency_message: "This appears to be an emergency. Please stop this booking and contact our emergency line immediately at {{emergency_phone}} or visit the nearest ER.",
    notifications: { whatsapp_confirmation: true, appointment_summary: true, reminder_24h: true },
    legal_notice: "This chatbot does not provide medical diagnosis. For emergencies, contact the hospital directly."
  },
  business_name: "",
  ai_instructions: "",
  language: "so",
  currency: "ETB",
  widget_color: "#25D366",
  field_configs: [],
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
  business: [
    { id: 'customer_name', label: 'Customer Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
    { id: 'customer_query', label: 'How can we help you?', required: false, type: 'text', is_core: false },
  ],
  hospital: [
    { id: 'customer_name', label: 'Patient Name', required: true, type: 'text', is_core: true },
    { id: 'customer_phone', label: 'Phone Number', required: true, type: 'text', is_core: true },
    { id: 'gender', label: 'Gender', required: true, type: 'select', options: 'Male, Female', is_core: false },
    { id: 'age', label: 'Age / DOB', required: true, type: 'text', is_core: false },
    { id: 'appointment_date', label: 'Appointment Date', required: true, type: 'date', is_core: true },
    { id: 'appointment_time', label: 'Appointment Time', required: true, type: 'time', is_core: true },
    { id: 'department', label: 'Department (Service)', required: true, type: 'text', is_core: true },
    { id: 'doctor_name', label: 'Doctor Choice', required: false, type: 'text', is_core: true },
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
          medical_config: d.medical_config || {
            doctors: [
              { id: "dr_a", name: "Dr. A", department: "General", type: "In-person", languages: "Somali, English", duration: "30", max_patients: "10", status: "Active" },
              { id: "dr_b", name: "Dr. B", department: "Pediatrics", type: "In-person", languages: "Somali", duration: "30", max_patients: "10", status: "Active" },
            ],
            booking_rules: { one_per_day: true, same_day_allowed: true, booking_closure_hours: 1, max_advance_days: 7, auto_assign_doctor: true },
            emergency_keywords: ["emergency", "bleeding", "severe pain", "accident", "unconscious", "degdeg"],
            emergency_message: "This appears to be an emergency. Please stop this booking and contact our emergency line immediately at {{emergency_phone}} or visit the nearest ER.",
            notifications: { whatsapp_confirmation: true, appointment_summary: true, reminder_24h: true },
            legal_notice: "This chatbot does not provide medical diagnosis. For emergencies, contact the hospital directly."
          },
          language: (d.language as "so" | "en") || "so",
          currency: d.currency || "ETB",
          widget_color: d.widget_color || "#25D366",
          ai_instructions: d.ai_instructions || "",
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
        medical_config: config.medical_config,
        custom_fields: customFields,
        language: config.language,
        currency: config.currency,
        widget_color: config.widget_color,

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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-10 md:mb-12">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">
              Configure Booking Assistant
            </h1>
            <p className="text-xs sm:text-base md:text-lg lg:text-xl text-muted-foreground px-2 sm:px-4">
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
                      onClick={() => handleSelectBusinessType("business")}
                      disabled={plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("business")}
                      className="disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Card className="p-4 hover:shadow-lg transition-shadow border-border cursor-pointer text-left h-full group-disabled:pointer-events-none">
                        <BriefcaseBusiness className="w-8 h-8 text-accent mb-3" />
                        <h4 className="font-semibold">Business Support</h4>
                        <p className="text-xs text-muted-foreground mt-1">Customer support & Q&A</p>
                        {plan !== 'enterprise' && configsCount >= 1 && !existingTypes.includes("business") && (
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
                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedBusinessType(null)} className="gap-2 shrink-0">
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden xs:inline">Back</span>
                      </Button>
                      <Badge variant={config.is_active ? "default" : "outline"} className="shrink-0">
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="business_name" className="text-sm">Business Name *</Label>
                          <Input
                            id="business_name"
                            placeholder="e.g. Grand Hotel"
                            value={config.business_name}
                            onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                            className="h-10 text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language" className="flex items-center gap-2 text-base font-semibold">
                            <Languages className="w-5 h-5 text-primary" />
                            AI Assistant Language
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Key Feature</span>
                          </Label>
                          <Select
                            value={config.language}
                            onValueChange={(val: "so" | "en") => setConfig({ ...config, language: val })}
                          >
                            <SelectTrigger className="bg-background h-12 text-base border-2 border-primary/30 hover:border-primary/50 transition-colors">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="so" className="text-base py-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-semibold">Somali</div>
                                    <div className="text-xs text-muted-foreground">Advanced Somali language AI</div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="en" className="text-base py-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-semibold">English</div>
                                    <div className="text-xs text-muted-foreground">International English</div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                            <p className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">ℹ️</span>
                              <span>
                                The AI will <strong>strictly respond</strong> in {config.language === 'so' ? 'Somali' : 'English'}.
                                Customers can write in any language, but responses will always be in your selected language.
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="currency" className="text-sm">Currency</Label>
                          <Select
                            value={config.currency}
                            onValueChange={(val: string) => setConfig({ ...config, currency: val })}
                          >
                            <SelectTrigger className="bg-background h-10 text-sm">
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
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            Currency for room prices.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="widget_color" className="text-sm">Web Chat Color</Label>
                          <div className="flex gap-3 items-center">
                            <Input
                              id="widget_color"
                              type="color"
                              value={config.widget_color}
                              onChange={(e) => setConfig({ ...config, widget_color: e.target.value })}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={config.widget_color}
                              onChange={(e) => setConfig({ ...config, widget_color: e.target.value })}
                              className="h-10 text-sm font-mono"
                              placeholder="#000000"
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            Brand color for your web chat widget.
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

                      {(selectedBusinessType === "hotel" || selectedBusinessType === "business" || selectedBusinessType === "hospital") && (
                        <div className="bg-muted/30 p-4 rounded-lg border space-y-4 mt-4">
                          <h4 className="font-semibold text-sm capitalize">{selectedBusinessType === "business" ? "Business" : selectedBusinessType} Template Settings</h4>

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

                          {selectedBusinessType === "business" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Business Hours</Label>
                              <OpeningHoursEditor
                                value={config.restaurant_opening_hours}
                                onChange={(val) => setConfig({ ...config, restaurant_opening_hours: val })}
                              />
                            </div>
                          )}

                          {selectedBusinessType === "hospital" && (
                            <div className="space-y-2">
                              {/* Legacy Departments info for backward compatibility if needed, but we prefer the new editor */}
                              <MedicalTemplateEditor
                                value={config.medical_config}
                                onChange={(medConfig) => setConfig({ ...config, medical_config: medConfig })}
                              />

                              {selectedBusinessType === "hospital" && (
                                <div className="mt-8 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                                  <DoctorSlotsManager
                                    doctors={config.medical_config.doctors}
                                    userId={user?.id || ""}
                                  />
                                </div>
                              )}
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

                    <div className="flex justify-end gap-3 mt-6">
                      <Button onClick={saveConfiguration} disabled={loading} className="bg-gradient-primary w-full sm:w-auto h-11 sm:h-auto font-bold uppercase tracking-wider text-xs">
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