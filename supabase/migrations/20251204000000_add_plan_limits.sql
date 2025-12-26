-- Add plan-based limits to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS knowledge_base_limit INTEGER,
  ADD COLUMN IF NOT EXISTS products_limit INTEGER,
  ADD COLUMN IF NOT EXISTS max_chars_per_item INTEGER;

-- Set default limits based on plan
-- Free plan: 3 knowledge items, 10 products, 1000 chars/item
UPDATE public.subscriptions
SET 
  knowledge_base_limit = 3,
  products_limit = 10,
  max_chars_per_item = 1000
WHERE plan = 'free' AND knowledge_base_limit IS NULL;

-- Starter plan: 5 knowledge items, 50 products, 2000 chars/item
UPDATE public.subscriptions
SET 
  knowledge_base_limit = 5,
  products_limit = 50,
  max_chars_per_item = 2000
WHERE plan = 'starter' AND knowledge_base_limit IS NULL;

-- Enterprise plan: unlimited (9999) knowledge items, unlimited products, 3000 chars/item
UPDATE public.subscriptions
SET 
  knowledge_base_limit = 9999,
  products_limit = 9999,
  max_chars_per_item = 3000
WHERE plan = 'enterprise' AND knowledge_base_limit IS NULL;

-- Create function to set limits when plan changes
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set limits when plan changes
DROP TRIGGER IF EXISTS set_subscription_limits ON public.subscriptions;
CREATE TRIGGER set_subscription_limits
  BEFORE INSERT OR UPDATE OF plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_plan_limits();

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.knowledge_base_limit IS 'Maximum number of knowledge base items allowed for this plan';
COMMENT ON COLUMN public.subscriptions.products_limit IS 'Maximum number of products allowed for this plan';
COMMENT ON COLUMN public.subscriptions.max_chars_per_item IS 'Maximum characters per knowledge base item for this plan';
