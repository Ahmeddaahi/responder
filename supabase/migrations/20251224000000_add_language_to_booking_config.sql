ALTER TABLE public.booking_configurations 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'so' CHECK (language IN ('so', 'en'));

-- Add language column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'so' CHECK (language IN ('so', 'en'));

-- Update existing records to default to 'so' (Somali) if not already set
UPDATE public.booking_configurations SET language = 'so' WHERE language IS NULL;
UPDATE public.businesses SET language = 'so' WHERE language IS NULL;
