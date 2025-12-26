-- Add missing booking detail fields to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS number_of_guests INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_people INTEGER,
  ADD COLUMN IF NOT EXISTS table_preference TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_visit TEXT;

