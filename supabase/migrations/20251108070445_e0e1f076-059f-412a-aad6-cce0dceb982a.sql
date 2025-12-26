-- Create function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET messages_used = messages_used + 1
  WHERE user_id = p_user_id;
END;
$$;