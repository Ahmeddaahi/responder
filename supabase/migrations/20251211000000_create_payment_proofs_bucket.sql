-- Create payment_proofs storage bucket with public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) 
DO UPDATE SET public = true;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Payment proofs are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;

-- Allow public read access to all payment proofs
CREATE POLICY "Payment proofs are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment_proofs');

-- Allow authenticated users to upload payment proofs to their own folder
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment_proofs' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Allow users to update their own payment proofs
CREATE POLICY "Users can update their own payment proofs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'payment_proofs' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Allow admins to delete payment proofs
CREATE POLICY "Admins can delete payment proofs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'payment_proofs' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to manage all payment proofs
CREATE POLICY "Admins can manage all payment proofs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'payment_proofs' AND
    public.has_role(auth.uid(), 'admin')
  );

