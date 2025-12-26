-- Clear all processed webhooks to reset the system for clean testing
-- This will allow all messages to be processed fresh

-- Delete all processed webhook entries
DELETE FROM public.processed_webhooks;

-- Optional: Clear old message logs if you want a completely fresh start
-- Uncomment the line below if you also want to clear message history
-- DELETE FROM public.message_logs;

-- Optional: Clear messages table for telegram-webhook-business
-- Uncomment the line below if you want to clear business messages
-- DELETE FROM public.messages;

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'All processed webhooks have been cleared. System is ready for fresh testing.';
END $$;

