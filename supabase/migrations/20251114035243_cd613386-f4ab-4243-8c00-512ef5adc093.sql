-- Create storage bucket for complaint documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-documents', 'complaint-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for complaint-documents bucket

-- Users can upload documents for their own complaints
CREATE POLICY "Users can upload their complaint documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own complaint documents
CREATE POLICY "Users can view their own complaint documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all complaint documents
CREATE POLICY "Admins can view all complaint documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-documents' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete complaint documents
CREATE POLICY "Admins can delete complaint documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-documents' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatars bucket

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Everyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;