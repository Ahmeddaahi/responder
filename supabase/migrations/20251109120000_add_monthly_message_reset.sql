-- Update increment_message_count function to reset messages monthly
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the started_at date for this user
  SELECT started_at INTO v_started_at
  FROM public.subscriptions
  WHERE user_id = p_user_id;

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

-- Create function to check and reset messages if needed (for dashboard display)
CREATE OR REPLACE FUNCTION public.check_and_reset_messages(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the started_at date for this user
  SELECT started_at INTO v_started_at
  FROM public.subscriptions
  WHERE user_id = p_user_id;

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

