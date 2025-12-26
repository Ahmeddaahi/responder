-- Fix relationship between subscriptions and profiles
-- Change subscriptions.user_id to reference profiles.id instead of auth.users.id
-- Since profiles.id IS auth.users.id, this maintains data integrity while enabling proper joins

-- First, drop the existing foreign key constraint to auth.users
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Now add the foreign key to profiles
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Add RLS policy for admins to view all profiles (needed for admin dashboard)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

