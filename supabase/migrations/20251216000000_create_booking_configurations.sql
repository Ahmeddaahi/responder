-- Create booking_configurations table for per-business booking setup
CREATE TABLE IF NOT EXISTS public.booking_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK (business_type IN ('hotel', 'restaurant', 'hospital', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,

  -- Common fields
  require_customer_name BOOLEAN DEFAULT TRUE,
  require_customer_phone BOOLEAN DEFAULT TRUE,
  require_customer_email BOOLEAN DEFAULT FALSE,

  -- Hotel-specific fields
  require_check_in_date BOOLEAN DEFAULT TRUE,
  require_check_out_date BOOLEAN DEFAULT TRUE,
  require_room_type BOOLEAN DEFAULT FALSE,
  require_number_of_guests BOOLEAN DEFAULT TRUE,
  hotel_rooms_available JSONB,

  -- Restaurant-specific fields
  require_reservation_date BOOLEAN DEFAULT TRUE,
  require_reservation_time BOOLEAN DEFAULT TRUE,
  require_number_of_people BOOLEAN DEFAULT TRUE,
  require_table_preference BOOLEAN DEFAULT FALSE,
  require_special_requests BOOLEAN DEFAULT FALSE,
  restaurant_opening_hours JSONB,

  -- Hospital-specific fields
  require_appointment_date BOOLEAN DEFAULT TRUE,
  require_appointment_time BOOLEAN DEFAULT TRUE,
  require_department BOOLEAN DEFAULT TRUE,
  require_doctor_name BOOLEAN DEFAULT FALSE,
  require_reason_for_visit BOOLEAN DEFAULT TRUE,
  hospital_departments JSONB,

  -- Custom booking fields (flexible extension)
  custom_fields JSONB DEFAULT '[]'::jsonb,

  -- Optional free-form AI instructions to guide the assistant
  ai_instructions TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT booking_configurations_user_business_unique
    UNIQUE (user_id, business_type)
);

-- Enable RLS
ALTER TABLE public.booking_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own configurations
CREATE POLICY "Users can select their booking configurations"
  ON public.booking_configurations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their booking configurations"
  ON public.booking_configurations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their booking configurations"
  ON public.booking_configurations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their booking configurations"
  ON public.booking_configurations
  FOR DELETE
  USING (auth.uid() = user_id);


