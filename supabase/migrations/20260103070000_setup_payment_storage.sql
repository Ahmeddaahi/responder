-- Create the storage bucket for payment receipts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to read the files
CREATE POLICY "Public Access to Payment Proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment_proofs');

-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment_proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
