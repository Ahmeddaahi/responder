-- Add payment_name column to payment_requests table
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS payment_name TEXT;
