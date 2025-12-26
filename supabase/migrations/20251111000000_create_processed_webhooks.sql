-- Create table to track processed webhook messages to prevent duplicates
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_type NOT NULL,
  external_message_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, external_message_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_lookup 
  ON public.processed_webhooks(platform, external_message_id, user_id);

-- Enable RLS
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage processed webhooks"
  ON public.processed_webhooks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to clean up old entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_webhooks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.processed_webhooks
  WHERE processed_at < NOW() - INTERVAL '24 hours';
END;
$$;

