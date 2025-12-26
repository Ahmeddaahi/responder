-- Create bookings table to store completed booking requests
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL, -- WhatsApp phone or Telegram ID
  platform public.platform_type NOT NULL,
  booking_type TEXT NOT NULL, -- 'hotel', 'restaurant', 'hospital', 'custom'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'

  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Hotel / stay fields
  check_in_date DATE,
  check_out_date DATE,

  -- Restaurant reservation fields
  reservation_date DATE,
  reservation_time TEXT,

  -- Hospital appointment fields
  appointment_date DATE,
  appointment_time TEXT,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_platform
  ON public.bookings(user_id, platform, created_at DESC);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own bookings
CREATE POLICY "Users can view their bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their bookings"
  ON public.bookings
  FOR DELETE
  USING (auth.uid() = user_id);


