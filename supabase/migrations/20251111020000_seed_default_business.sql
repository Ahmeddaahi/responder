-- Seed a default business for telegram-webhook-business function
-- This is a temporary solution - in production, you should create businesses through your application

INSERT INTO public.businesses (id, name, description, services, location, working_hours, contact, ai_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Business',
  'Default business for telegram webhook',
  'Customer service, AI chat support',
  'Not specified',
  '24/7',
  'Not specified',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Note: You'll need to add a telegram token for this business
-- You can do this by inserting into telegram_tokens table:
-- INSERT INTO public.telegram_tokens (business_id, token)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'your_bot_token_here')
-- ON CONFLICT (business_id) DO UPDATE SET token = EXCLUDED.token;

