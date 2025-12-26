-- Create businesses table for telegram-webhook-business function
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  services TEXT,
  location TEXT,
  working_hours TEXT,
  contact TEXT,
  ai_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telegram_tokens table for secure token storage
CREATE TABLE IF NOT EXISTS public.telegram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id)
);

-- Create messages table for telegram-webhook-business function
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_telegram_id TEXT NOT NULL,
  customer_message TEXT NOT NULL,
  ai_reply TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table for businesses
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
-- Allow service role full access (for webhook functions)
CREATE POLICY "Service role can manage businesses"
  ON public.businesses FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for telegram_tokens
-- Allow service role full access (for webhook functions)
CREATE POLICY "Service role can manage telegram tokens"
  ON public.telegram_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for messages
-- Allow service role full access (for webhook functions)
CREATE POLICY "Service role can manage messages"
  ON public.messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for products
-- Allow service role full access (for webhook functions)
CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_tokens_business_id ON public.telegram_tokens(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON public.messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer_telegram_id ON public.messages(customer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);

-- Create trigger for updated_at on businesses
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on telegram_tokens
CREATE TRIGGER update_telegram_tokens_updated_at
  BEFORE UPDATE ON public.telegram_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

