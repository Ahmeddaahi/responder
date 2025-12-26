-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL, -- Phone number or Telegram ID
  platform TEXT NOT NULL, -- 'whatsapp' or 'telegram'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_identifier, platform)
);

-- Create user_protection_stats table for rate limiting and warnings
CREATE TABLE IF NOT EXISTS public.user_protection_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  platform TEXT NOT NULL,
  message_count_1min INTEGER DEFAULT 0,
  window_start_1min TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count_10min INTEGER DEFAULT 0,
  window_start_10min TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  warning_count INTEGER DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_identifier, platform)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_protection_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service Role Access Only for now, as these are backend managed)
CREATE POLICY "Service role can manage blocked_users"
  ON public.blocked_users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage user_protection_stats"
  ON public.user_protection_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_identifier ON public.blocked_users(user_identifier, platform);
CREATE INDEX IF NOT EXISTS idx_user_protection_stats_identifier ON public.user_protection_stats(user_identifier, platform);
