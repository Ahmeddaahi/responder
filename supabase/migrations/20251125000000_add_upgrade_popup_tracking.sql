-- Add column to track when users have seen the upgrade popup
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_upgrade_popup_shown TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the purpose of the column
COMMENT ON COLUMN public.subscriptions.last_upgrade_popup_shown 
IS 'Timestamp of when the upgrade popup was last shown to the user';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_last_upgrade_popup_shown 
ON public.subscriptions(user_id, last_upgrade_popup_shown);