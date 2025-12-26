-- Migration: Add unique constraints for bot_token and phone_number
-- This ensures that each bot token and phone number can only be used by one user

-- Step 1: Handle existing duplicates before creating unique constraints
-- For bot_token duplicates: Keep the most recent record, clear others
DO $$
DECLARE
  duplicate_record RECORD;
  agent_id_array UUID[];
  i INTEGER;
BEGIN
  -- Find and handle duplicate bot_tokens
  FOR duplicate_record IN
    SELECT bot_token, array_agg(id ORDER BY updated_at DESC, created_at DESC) as agent_ids
    FROM public.agents
    WHERE bot_token IS NOT NULL
    GROUP BY bot_token
    HAVING COUNT(*) > 1
  LOOP
    agent_id_array := duplicate_record.agent_ids;
    -- Keep the first (most recent) record, clear bot_token from others
    -- Skip first element (index 1), update from index 2 onwards
    IF array_length(agent_id_array, 1) > 1 THEN
      FOR i IN 2..array_length(agent_id_array, 1) LOOP
        UPDATE public.agents
        SET bot_token = NULL,
            is_active = FALSE,
            updated_at = NOW()
        WHERE id = agent_id_array[i]
          AND bot_token = duplicate_record.bot_token;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Cleared duplicate bot_token: %, kept most recent record', duplicate_record.bot_token;
  END LOOP;
END $$;

-- For phone_number duplicates: Keep the most recent record, clear others
DO $$
DECLARE
  duplicate_record RECORD;
  agent_id_array UUID[];
  i INTEGER;
BEGIN
  -- Find and handle duplicate phone_numbers
  FOR duplicate_record IN
    SELECT phone_number, array_agg(id ORDER BY updated_at DESC, created_at DESC) as agent_ids
    FROM public.agents
    WHERE phone_number IS NOT NULL
    GROUP BY phone_number
    HAVING COUNT(*) > 1
  LOOP
    agent_id_array := duplicate_record.agent_ids;
    -- Keep the first (most recent) record, clear phone_number from others
    -- Skip first element (index 1), update from index 2 onwards
    IF array_length(agent_id_array, 1) > 1 THEN
      FOR i IN 2..array_length(agent_id_array, 1) LOOP
        UPDATE public.agents
        SET phone_number = NULL,
            is_active = FALSE,
            updated_at = NOW()
        WHERE id = agent_id_array[i]
          AND phone_number = duplicate_record.phone_number;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Cleared duplicate phone_number: %, kept most recent record', duplicate_record.phone_number;
  END LOOP;
END $$;

-- For phone_number_id duplicates: Keep the most recent record, clear others
DO $$
DECLARE
  duplicate_record RECORD;
  agent_id_array UUID[];
  i INTEGER;
BEGIN
  -- Find and handle duplicate phone_number_ids
  FOR duplicate_record IN
    SELECT phone_number_id, array_agg(id ORDER BY updated_at DESC, created_at DESC) as agent_ids
    FROM public.agents
    WHERE phone_number_id IS NOT NULL
    GROUP BY phone_number_id
    HAVING COUNT(*) > 1
  LOOP
    agent_id_array := duplicate_record.agent_ids;
    -- Keep the first (most recent) record, clear phone_number_id from others
    -- Skip first element (index 1), update from index 2 onwards
    IF array_length(agent_id_array, 1) > 1 THEN
      FOR i IN 2..array_length(agent_id_array, 1) LOOP
        UPDATE public.agents
        SET phone_number_id = NULL,
            is_active = FALSE,
            updated_at = NOW()
        WHERE id = agent_id_array[i]
          AND phone_number_id = duplicate_record.phone_number_id;
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Cleared duplicate phone_number_id: %, kept most recent record', duplicate_record.phone_number_id;
  END LOOP;
END $$;

-- Step 2: Drop existing indexes if they exist (in case migration was partially run)
DROP INDEX IF EXISTS public.agents_bot_token_unique_idx;
DROP INDEX IF EXISTS public.agents_phone_number_unique_idx;
DROP INDEX IF EXISTS public.agents_phone_number_id_unique_idx;

-- Step 3: Add unique constraint for bot_token (only for non-null values)
-- Using a partial unique index to allow multiple NULL values
CREATE UNIQUE INDEX agents_bot_token_unique_idx 
ON public.agents (bot_token) 
WHERE bot_token IS NOT NULL;

-- Step 4: Add unique constraint for phone_number (only for non-null values)
-- Using a partial unique index to allow multiple NULL values
CREATE UNIQUE INDEX agents_phone_number_unique_idx 
ON public.agents (phone_number) 
WHERE phone_number IS NOT NULL;

-- Step 5: Add unique constraint for phone_number_id (only for non-null values)
-- This is also important for WhatsApp webhook matching
CREATE UNIQUE INDEX agents_phone_number_id_unique_idx 
ON public.agents (phone_number_id) 
WHERE phone_number_id IS NOT NULL;

-- Create a function to check if bot_token already exists (excluding current user's own record)
CREATE OR REPLACE FUNCTION public.check_bot_token_unique(
  p_bot_token TEXT,
  p_user_id UUID,
  p_platform platform_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- If bot_token is NULL, allow it (no uniqueness check needed)
  IF p_bot_token IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if bot_token exists for a different user or different platform
  SELECT EXISTS (
    SELECT 1
    FROM public.agents
    WHERE bot_token = p_bot_token
      AND (user_id != p_user_id OR platform != p_platform)
  ) INTO v_exists;

  -- Return TRUE if token doesn't exist (unique), FALSE if it exists (not unique)
  RETURN NOT v_exists;
END;
$$;

-- Create a function to check if phone_number already exists (excluding current user's own record)
CREATE OR REPLACE FUNCTION public.check_phone_number_unique(
  p_phone_number TEXT,
  p_user_id UUID,
  p_platform platform_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- If phone_number is NULL, allow it (no uniqueness check needed)
  IF p_phone_number IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if phone_number exists for a different user or different platform
  SELECT EXISTS (
    SELECT 1
    FROM public.agents
    WHERE phone_number = p_phone_number
      AND (user_id != p_user_id OR platform != p_platform)
  ) INTO v_exists;

  -- Return TRUE if phone_number doesn't exist (unique), FALSE if it exists (not unique)
  RETURN NOT v_exists;
END;
$$;

-- Create a function to check if phone_number_id already exists (excluding current user's own record)
CREATE OR REPLACE FUNCTION public.check_phone_number_id_unique(
  p_phone_number_id TEXT,
  p_user_id UUID,
  p_platform platform_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- If phone_number_id is NULL, allow it (no uniqueness check needed)
  IF p_phone_number_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if phone_number_id exists for a different user or different platform
  SELECT EXISTS (
    SELECT 1
    FROM public.agents
    WHERE phone_number_id = p_phone_number_id
      AND (user_id != p_user_id OR platform != p_platform)
  ) INTO v_exists;

  -- Return TRUE if phone_number_id doesn't exist (unique), FALSE if it exists (not unique)
  RETURN NOT v_exists;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.check_bot_token_unique IS 'Checks if a bot_token is unique (not used by another user/platform)';
COMMENT ON FUNCTION public.check_phone_number_unique IS 'Checks if a phone_number is unique (not used by another user/platform)';
COMMENT ON FUNCTION public.check_phone_number_id_unique IS 'Checks if a phone_number_id is unique (not used by another user/platform)';

