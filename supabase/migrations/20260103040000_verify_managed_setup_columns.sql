-- Ensure all columns exist for managed_setups
DO $$ 
BEGIN 
    -- Add receipt_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'receipt_url') THEN
        ALTER TABLE public.managed_setups ADD COLUMN receipt_url TEXT;
    END IF;

    -- Add payment_method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'payment_method') THEN
        ALTER TABLE public.managed_setups ADD COLUMN payment_method TEXT;
    END IF;

    -- Add rejection_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.managed_setups ADD COLUMN rejection_reason TEXT;
    END IF;

    -- Ensure payment_status has 'rejected' in check constraint if it exists
    -- This is harder to do in a simple IF, so we'll just ensure the column exists with the correct type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'managed_setups' AND column_name = 'payment_status') THEN
        ALTER TABLE public.managed_setups ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
END $$;
