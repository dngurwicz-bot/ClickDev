-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload avatars
CREATE POLICY "Avatar Upload Policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy to allow authenticated users to update their own avatars
CREATE POLICY "Avatar Update Policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Policy to allow public to view avatars
CREATE POLICY "Avatar View Policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Policy to allow users to delete their own avatars
CREATE POLICY "Avatar Delete Policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());
