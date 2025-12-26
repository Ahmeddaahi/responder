-- Add phone_number_id column to agents table
ALTER TABLE public.agents
ADD COLUMN phone_number_id TEXT;

-- Add index for faster lookups
CREATE INDEX idx_agents_phone_number_id ON public.agents(phone_number_id);

-- Add comment
COMMENT ON COLUMN public.agents.phone_number_id IS 'WhatsApp Phone Number ID from Meta (used for webhook matching)';

