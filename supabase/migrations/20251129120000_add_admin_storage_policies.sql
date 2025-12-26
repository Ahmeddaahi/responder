-- Add storage policies for admins to manage payment proof screenshots

-- Allow admins to delete payment proof files
CREATE POLICY "Admins can delete payment proofs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment_proofs' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to view all payment proofs
CREATE POLICY "Admins can view all payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment_proofs' AND
    public.has_role(auth.uid(), 'admin')
  );
