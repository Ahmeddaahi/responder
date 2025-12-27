-- Ensure all active paid subscriptions have an expires_at date (30 days from start)
UPDATE public.subscriptions
SET expires_at = started_at + INTERVAL '30 days'
WHERE plan != 'free' 
  AND expires_at IS NULL;

-- Update the set_plan_limits function to also set expires_at for paid plans
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
    NEW.expires_at := NULL; -- Free plan doesn't expire
  ELSIF NEW.plan = 'starter' THEN
    NEW.message_limit := 500;
    NEW.knowledge_base_limit := 10;
    NEW.products_limit := 50;
    NEW.max_chars_per_item := 2000;
    NEW.bookings_limit := 50;
    NEW.room_types_limit := 10;
    NEW.expires_at := NOW() + INTERVAL '30 days';
  ELSIF NEW.plan = 'enterprise' THEN
    NEW.message_limit := 10000;
    NEW.knowledge_base_limit := 9999;
    NEW.products_limit := 9999;
    NEW.max_chars_per_item := 3000;
    NEW.bookings_limit := 9999;
    NEW.room_types_limit := 9999;
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$$;
