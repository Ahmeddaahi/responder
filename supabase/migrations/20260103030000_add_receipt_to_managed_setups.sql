-- Add payment tracking and receipt URL to managed_setups
ALTER TABLE public.managed_setups 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_request_id UUID REFERENCES public.payment_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
