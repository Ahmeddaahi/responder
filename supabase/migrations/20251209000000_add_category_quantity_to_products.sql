-- Add category and quantity columns to user_products table
ALTER TABLE public.user_products
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER;
