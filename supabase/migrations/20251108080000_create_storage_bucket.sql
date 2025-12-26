-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-documents', 'business-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for business-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-documents');

