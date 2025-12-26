-- Add foreign key relationship between payments and profiles
-- This allows us to join payments with user profiles to get email addresses

-- First, ensure the profiles table has the user_id as primary key
-- (This should already exist, but we're being explicit)

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_user_id_profiles_fkey' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment
COMMENT ON CONSTRAINT payments_user_id_profiles_fkey ON public.payments 
IS 'Links payments to user profiles for email lookup';
