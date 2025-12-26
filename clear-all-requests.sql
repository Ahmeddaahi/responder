-- Quick script to clear all processed webhooks and reset the system
-- Run this in Supabase SQL Editor to clear all pending/old requests

-- Clear all processed webhooks (this resets idempotency tracking)
DELETE FROM public.processed_webhooks;

-- Show count of remaining entries (should be 0)
SELECT COUNT(*) as remaining_processed_webhooks FROM public.processed_webhooks;

-- Optional: If you also want to clear message history, uncomment these:
-- DELETE FROM public.message_logs;
-- DELETE FROM public.messages;

-- Verify cleanup
SELECT 
  'processed_webhooks' as table_name, 
  COUNT(*) as remaining_count 
FROM public.processed_webhooks
UNION ALL
SELECT 
  'message_logs' as table_name, 
  COUNT(*) as remaining_count 
FROM public.message_logs
UNION ALL
SELECT 
  'messages' as table_name, 
  COUNT(*) as remaining_count 
FROM public.messages;

