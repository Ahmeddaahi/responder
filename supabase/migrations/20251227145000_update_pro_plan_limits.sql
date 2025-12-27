-- Update the set_plan_limits function to use 500 messages for the starter plan
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
    NEW.message_limit := 500;
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

-- Update existing starter subscriptions to the new 500 message limit
UPDATE public.subscriptions
SET 
  message_limit = 500
WHERE plan = 'starter';
