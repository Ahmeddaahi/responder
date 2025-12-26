-- Create migration to enhance booking configuration
ALTER TABLE public.booking_configurations
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS field_configs JSONB DEFAULT '[]'::jsonb;

-- Add custom_data column to bookings to store responses to custom fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
