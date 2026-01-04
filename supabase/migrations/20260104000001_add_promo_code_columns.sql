-- Add promo_code column to payment_requests
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Add promo_code column to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_promo_code ON public.payment_requests(promo_code);
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON public.bookings(promo_code);
