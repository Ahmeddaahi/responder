-- Add 'custom' value to subscription_plan enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'subscription_plan' AND n.nspname = 'public') THEN
        CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'enterprise', 'custom');
    ELSE
        ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'custom';
    END IF;
END $$;

-- Update the set_plan_limits function to handle 'custom'
CREATE OR REPLACE FUNCTION public.set_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set limits based on new plan
  IF NEW.plan = 'free' THEN
    NEW.knowledge_base_limit := 3;
    NEW.products_limit := 10;
    NEW.max_chars_per_item := 1000;
  ELSIF NEW.plan = 'starter' THEN
    NEW.knowledge_base_limit := 5;
    NEW.products_limit := 50;
    NEW.max_chars_per_item := 2000;
  ELSIF NEW.plan = 'enterprise' THEN
    NEW.knowledge_base_limit := 9999;
    NEW.products_limit := 9999;
    NEW.max_chars_per_item := 3000;
  ELSIF NEW.plan = 'custom' THEN
    -- For custom plan, set high defaults if they are null
    IF NEW.knowledge_base_limit IS NULL THEN
      NEW.knowledge_base_limit := 9999;
    END IF;
    IF NEW.products_limit IS NULL THEN
      NEW.products_limit := 9999;
    END IF;
    IF NEW.max_chars_per_item IS NULL THEN
      NEW.max_chars_per_item := 5000;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
