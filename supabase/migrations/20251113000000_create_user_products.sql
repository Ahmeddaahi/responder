-- Create user_products table for main system (linked to user_id)
CREATE TABLE IF NOT EXISTS public.user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_products table
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_products
CREATE POLICY "Users can view their own products"
  ON public.user_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.user_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.user_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.user_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON public.user_products(user_id);

-- Create trigger for updated_at on user_products
CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON public.user_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

