-- Add missing receipt_url column to payment_requests table
ALTER TABLE public.payment_requests 
ADD COLUMN receipt_url TEXT;
