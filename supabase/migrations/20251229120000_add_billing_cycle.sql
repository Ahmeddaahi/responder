-- Add billing_cycle to payment_requests
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Add billing_cycle to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Update increment_message_count to handle yearly reset
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_billing_cycle TEXT;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
  v_reset_interval INTERVAL;
BEGIN
  -- Get the started_at and billing_cycle for this user
  SELECT started_at, billing_cycle INTO v_started_at, v_billing_cycle
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- Default to monthly if null
  IF v_billing_cycle IS NULL THEN
    v_billing_cycle := 'monthly';
  END IF;

  -- Determine reset interval
  IF v_billing_cycle = 'annually' THEN
    v_reset_interval := INTERVAL '1 year';
  ELSE
    v_reset_interval := INTERVAL '30 days';
  END IF;

  -- If started_at is NULL, set it to now
  IF v_started_at IS NULL THEN
    UPDATE public.subscriptions
    SET started_at = NOW()
    WHERE user_id = p_user_id;
    v_started_at := NOW();
  END IF;

  -- Calculate next reset date
  v_next_reset_date := v_started_at + v_reset_interval;

  -- If the next reset date has passed, reset messages and update started_at
  IF NOW() >= v_next_reset_date THEN
    UPDATE public.subscriptions
    SET 
      messages_used = 1,  -- Reset to 0 and then increment to 1
      started_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Otherwise, just increment the message count
    UPDATE public.subscriptions
    SET messages_used = messages_used + 1
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Update check_and_reset_messages to handle yearly reset
CREATE OR REPLACE FUNCTION public.check_and_reset_messages(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_billing_cycle TEXT;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
  v_reset_interval INTERVAL;
BEGIN
  -- Get the started_at and billing_cycle for this user
  SELECT started_at, billing_cycle INTO v_started_at, v_billing_cycle
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- Default to monthly if null
  IF v_billing_cycle IS NULL THEN
    v_billing_cycle := 'monthly';
  END IF;

  -- Determine reset interval
  IF v_billing_cycle = 'annually' THEN
    v_reset_interval := INTERVAL '1 year';
  ELSE
    v_reset_interval := INTERVAL '30 days';
  END IF;

  -- If started_at is NULL, set it to now
  IF v_started_at IS NULL THEN
    UPDATE public.subscriptions
    SET started_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Calculate next reset date
  v_next_reset_date := v_started_at + v_reset_interval;

  -- If the next reset date has passed, reset messages and update started_at
  IF NOW() >= v_next_reset_date THEN
    UPDATE public.subscriptions
    SET 
      messages_used = 0,
      started_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
