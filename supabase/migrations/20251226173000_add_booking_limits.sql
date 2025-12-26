-- Migration: Add booking and room type limits
-- Date: 2025-12-26

-- Add new columns to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS bookings_limit INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS bookings_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_types_limit INTEGER DEFAULT 2;

-- Update the set_plan_limits function to handle the new columns
CREATE OR REPLACE FUNCTION public.set_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set limits based on new plan
  IF NEW.plan = 'free' THEN
    NEW.message_limit := 50;
    NEW.knowledge_base_limit := 3;
    NEW.products_limit := 10;
    NEW.max_chars_per_item := 1000;
    NEW.bookings_limit := 5;
    NEW.room_types_limit := 2;
  ELSIF NEW.plan = 'starter' THEN
    NEW.message_limit := 1000;
    NEW.knowledge_base_limit := 10;
    NEW.products_limit := 50;
    NEW.max_chars_per_item := 2000;
    NEW.bookings_limit := 50;
    NEW.room_types_limit := 10;
  ELSIF NEW.plan = 'enterprise' THEN
    NEW.message_limit := 10000;
    NEW.knowledge_base_limit := 9999;
    NEW.products_limit := 9999;
    NEW.max_chars_per_item := 3000;
    NEW.bookings_limit := 9999;
    NEW.room_types_limit := 9999;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing subscriptions to match new limits
UPDATE public.subscriptions
SET 
  message_limit = 50,
  bookings_limit = 5,
  room_types_limit = 2
WHERE plan = 'free';

UPDATE public.subscriptions
SET 
  message_limit = 1000,
  bookings_limit = 50,
  room_types_limit = 10
WHERE plan = 'starter';

UPDATE public.subscriptions
SET 
  message_limit = 10000,
  bookings_limit = 9999,
  room_types_limit = 9999
WHERE plan = 'enterprise';

-- Add comments for documentation
COMMENT ON COLUMN public.subscriptions.bookings_limit IS 'Maximum number of bookings allowed per month';
COMMENT ON COLUMN public.subscriptions.bookings_used IS 'Number of bookings completed in the current month';
COMMENT ON COLUMN public.subscriptions.room_types_limit IS 'Maximum number of room/service types allowed in configuration';
