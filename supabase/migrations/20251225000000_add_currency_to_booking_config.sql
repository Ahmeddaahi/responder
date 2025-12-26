-- Add currency column to booking_configurations table
ALTER TABLE public.booking_configurations 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB' CHECK (currency IN ('ETB', 'USD', 'EUR', 'GBP', 'KES', 'SOS', 'AED', 'SAR'));

-- Update existing records to default to ETB if not already set
UPDATE public.booking_configurations SET currency = 'ETB' WHERE currency IS NULL;
