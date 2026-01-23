-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for logos bucket
CREATE POLICY "Allow public read access to logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
