-- Create managed_setups table
CREATE TABLE IF NOT EXISTS public.managed_setups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.managed_setups ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can create their own setup requests"
ON public.managed_setups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own setup requests"
ON public.managed_setups FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policies for admins
CREATE POLICY "Admins can view all setup requests"
ON public.managed_setups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all setup requests"
ON public.managed_setups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS managed_setups_user_id_idx ON public.managed_setups(user_id);
CREATE INDEX IF NOT EXISTS managed_setups_status_idx ON public.managed_setups(status);

-- Add foreign key to profiles for easier joins
ALTER TABLE public.managed_setups
ADD CONSTRAINT managed_setups_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
