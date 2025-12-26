-- Create admin_actions table for audit log
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('plan_change', 'limit_change', 'activate', 'deactivate')),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all admin actions"
  ON public.admin_actions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin actions"
  ON public.admin_actions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_admin_actions_admin_user ON public.admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_target_user ON public.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

