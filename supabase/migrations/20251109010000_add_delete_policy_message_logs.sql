-- Add DELETE policy for message_logs
CREATE POLICY "Users can delete their own messages"
  ON public.message_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete all messages
CREATE POLICY "Admins can delete all messages"
  ON public.message_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

