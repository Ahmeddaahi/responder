-- Initialize notification_shown field for existing verified payments
-- This ensures that users who already had their payments verified won't see the popup again

UPDATE public.payment_requests 
SET notification_shown = true 
WHERE status = 'verified' 
AND notification_shown IS NULL;