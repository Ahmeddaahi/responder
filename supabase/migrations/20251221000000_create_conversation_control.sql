-- Create enum for conversation modes
DO $$ BEGIN
    CREATE TYPE public.conversation_mode AS ENUM ('bot', 'human');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create conversation_control table
CREATE TABLE IF NOT EXISTS public.conversation_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    platform public.platform_type NOT NULL,
    mode public.conversation_mode NOT NULL DEFAULT 'bot',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, customer_id, platform)
);

-- Enable RLS
ALTER TABLE public.conversation_control ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own conversation controls"
    ON public.conversation_control FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all conversation controls"
    ON public.conversation_control FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_conversation_control_updated_at
    BEFORE UPDATE ON public.conversation_control
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
