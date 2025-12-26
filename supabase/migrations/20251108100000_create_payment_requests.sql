-- Create payment_requests table for manual payment verification
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_plan subscription_plan NOT NULL,
  current_plan subscription_plan NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  transaction_reference TEXT,
  payment_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
CREATE POLICY "Users can view their own payment requests"
  ON public.payment_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment requests"
  ON public.payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests"
  ON public.payment_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment requests"
  ON public.payment_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_payment_requests_user ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

