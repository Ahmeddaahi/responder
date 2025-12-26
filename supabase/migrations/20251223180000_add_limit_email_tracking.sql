-- Add limit_email_sent_at to subscriptions table to track when notification was last sent
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS limit_email_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.subscriptions.limit_email_sent_at IS 'Timestamp of when the usage limit notification email was last sent to the user';
