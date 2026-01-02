-- Migration to create doctor_slots table for shared availability
CREATE TABLE IF NOT EXISTS public.doctor_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL, -- ID of the doctor from medical_config
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'booked', 'blocked'
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  patient_info TEXT, -- For manual walk-in entries (name/phone)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent double booking at the database level
  UNIQUE (doctor_id, slot_date, slot_time)
);

-- Index for fast lookup by doctor and date
CREATE INDEX IF NOT EXISTS idx_doctor_slots_lookup ON public.doctor_slots(doctor_id, slot_date);

-- Enable RLS
ALTER TABLE public.doctor_slots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own doctor slots"
  ON public.doctor_slots
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doctor_slots_updated_at
    BEFORE UPDATE ON public.doctor_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
