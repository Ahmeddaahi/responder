-- COMPREHENSIVE FIX FOR MANAGED SETUPS
-- This script fixes all constraints and ensures all columns exist

-- 1. Ensure columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'receipt_url') THEN
        ALTER TABLE public.managed_setups ADD COLUMN receipt_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'payment_method') THEN
        ALTER TABLE public.managed_setups ADD COLUMN payment_method TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.managed_setups ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- 2. Fix 'status' constraint (to allow 'rejected')
ALTER TABLE public.managed_setups 
DROP CONSTRAINT IF EXISTS managed_setups_status_check;

ALTER TABLE public.managed_setups 
ADD CONSTRAINT managed_setups_status_check 
CHECK (status IN ('pending', 'completed', 'rejected'));

-- 3. Fix 'payment_status' constraint (to allow 'rejected')
ALTER TABLE public.managed_setups 
DROP CONSTRAINT IF EXISTS managed_setups_payment_status_check;

ALTER TABLE public.managed_setups 
ADD CONSTRAINT managed_setups_payment_status_check 
CHECK (payment_status IN ('pending', 'verified', 'rejected'));
