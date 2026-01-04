-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The merchant who created the code
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10, 2) NOT NULL,
  purpose TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  is_first_time_only BOOLEAN DEFAULT FALSE,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  is_stackable BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT TRUE,
  restricted_products UUID[] DEFAULT '{}',
  restricted_plans TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on user_id and code
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_user_id_code_key UNIQUE (user_id, code);

-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The customer who used the code
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Policies for promo_codes
CREATE POLICY "Merchants can manage their own promo codes"
  ON public.promo_codes
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can view promo codes they use"
  ON public.promo_codes
  FOR SELECT
  USING (TRUE); -- Usually validated via code, but SELECT should be limited or public depending on design

-- Policies for promo_code_usage
CREATE POLICY "Merchants can view usage of their promo codes"
  ON public.promo_code_usage
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.promo_codes
    WHERE promo_codes.id = promo_code_usage.promo_id
    AND promo_codes.user_id = auth.uid()
  ));

CREATE POLICY "Customers can view their own promo usage"
  ON public.promo_code_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert their promo usage"
  ON public.promo_code_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_user_id ON public.promo_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_id ON public.promo_code_usage(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
