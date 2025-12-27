-- 1. Update increment_message_count to ONLY reset for paid plans
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
  v_plan subscription_plan;
BEGIN
  -- Get the current plan and started_at date
  SELECT started_at, plan INTO v_started_at, v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- NEVER reset for the 'free' plan (it's a one-time trial)
  IF v_plan = 'free' THEN
    UPDATE public.subscriptions
    SET messages_used = messages_used + 1
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- If started_at is NULL, set it to now
  IF v_started_at IS NULL THEN
    UPDATE public.subscriptions
    SET started_at = NOW()
    WHERE user_id = p_user_id;
    v_started_at := NOW();
  END IF;

  -- Calculate next reset date (30 days from started_at)
  v_next_reset_date := v_started_at + INTERVAL '30 days';

  -- If the next reset date has passed, reset messages and update started_at
  IF NOW() >= v_next_reset_date THEN
    UPDATE public.subscriptions
    SET 
      messages_used = 1,
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

-- 2. Update check_and_reset_messages to ONLY reset for paid plans
CREATE OR REPLACE FUNCTION public.check_and_reset_messages(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
  v_plan subscription_plan;
BEGIN
  -- Get the current plan and started_at date
  SELECT started_at, plan INTO v_started_at, v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id;

  -- Skip reset for 'free' plan
  IF v_plan = 'free' THEN
    RETURN;
  END IF;

  -- If started_at is NULL, set it to now
  IF v_started_at IS NULL THEN
    UPDATE public.subscriptions
    SET started_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Calculate next reset date (30 days from started_at)
  v_next_reset_date := v_started_at + INTERVAL '30 days';

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

-- 3. Update set_plan_limits to make Free plan expire after 30 days (non-renewable)
CREATE OR REPLACE FUNCTION public.set_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan = 'free' THEN
    NEW.message_limit := 50;
    NEW.knowledge_base_limit := 3;
    NEW.products_limit := 10;
    NEW.max_chars_per_item := 1000;
    NEW.bookings_limit := 5;
    NEW.room_types_limit := 2;
    NEW.expires_at := NOW() + INTERVAL '30 days'; -- Trial expires in 30 days
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
