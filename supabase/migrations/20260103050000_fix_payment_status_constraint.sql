-- Fix the payment_status check constraint to allow 'rejected'
DO $$ 
BEGIN 
    -- Drop the existing constraint if it exists
    -- We'll try to drop any constraint that might be checking this column
    BEGIN
        ALTER TABLE public.managed_setups DROP CONSTRAINT IF EXISTS managed_setups_payment_status_check;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Update the column to ensure it allows 'rejected'
    -- If the column exists, we just need to ensure the constraint is correct
    -- First, let's make sure the column doesn't have a check constraint that we missed
    -- We'll use a more generic approach to find and drop constraints on this column if needed
END $$;

-- Drop and re-create the check constraint
ALTER TABLE public.managed_setups DROP CONSTRAINT IF EXISTS managed_setups_payment_status_check;
ALTER TABLE public.managed_setups ADD CONSTRAINT managed_setups_payment_status_check 
    CHECK (payment_status IN ('pending', 'verified', 'rejected'));
