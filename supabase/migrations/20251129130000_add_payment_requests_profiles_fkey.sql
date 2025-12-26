-- Add foreign key relationship from payment_requests to profiles
-- This allows Supabase to automatically join these tables

-- First, drop the existing foreign key to auth.users if needed
-- (We'll keep it but add an additional constraint to profiles)

-- Add foreign key constraint to profiles table
-- Since profiles.id references auth.users(id) and payment_requests.user_id also references auth.users(id),
-- we can add a foreign key from payment_requests.user_id to profiles.id
ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Note: This creates a second foreign key on the same column, which is valid in PostgreSQL
-- payment_requests.user_id now references both auth.users(id) AND profiles(id)
-- Since profiles.id IS auth.users(id), this is logically consistent
