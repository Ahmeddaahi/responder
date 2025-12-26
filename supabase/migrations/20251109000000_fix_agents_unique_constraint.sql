-- Fix agents table to support multiple platforms per user
-- Drop the existing unique constraint on user_id
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_user_id_key;

-- Add a composite unique constraint on (user_id, platform)
-- This allows one user to have both Telegram and WhatsApp agents
ALTER TABLE public.agents ADD CONSTRAINT agents_user_id_platform_key UNIQUE (user_id, platform);

