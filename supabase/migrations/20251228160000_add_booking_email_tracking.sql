-- Add email tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_count INTEGER DEFAULT 0;

-- Add index for email tracking queries
CREATE INDEX IF NOT EXISTS idx_bookings_email_tracking 
ON public.bookings(user_id, last_email_sent_at);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.last_email_sent_at IS 'Timestamp of the last booking reminder email sent to the user';
COMMENT ON COLUMN public.bookings.email_sent_count IS 'Total number of reminder emails sent for this booking';
