-- Clear old WhatsApp conversation history to test new greeting with service list
-- This will delete all message logs for WhatsApp platform
-- Run this in your Supabase SQL Editor

-- Option 1: Delete ALL WhatsApp message logs (use this to completely reset)
DELETE FROM message_logs WHERE platform = 'whatsapp';

-- Option 2: Delete only messages from a specific customer phone number
-- Replace 'YOUR_PHONE_NUMBER' with the actual phone number (e.g., '252612345678')
-- DELETE FROM message_logs WHERE platform = 'whatsapp' AND customer_id = 'YOUR_PHONE_NUMBER';

-- Option 3: Delete only old greeting messages (messages with "Sidee kuu caawinaa" or "How can I help")
-- DELETE FROM message_logs 
-- WHERE platform = 'whatsapp' 
-- AND (ai_response LIKE '%Sidee kuu caawinaa%' OR ai_response LIKE '%How can I help%');

-- After running this, send "asc" to your WhatsApp bot again
-- It should now generate a fresh response with the service list
