-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS goal text;
