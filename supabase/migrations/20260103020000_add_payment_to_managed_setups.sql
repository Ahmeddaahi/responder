-- Add payment tracking to managed_setups
ALTER TABLE public.managed_setups
ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified'));

ADD COLUMN payment_request_id UUID REFERENCES public.payment_requests(id) ON DELETE SET NULL;
