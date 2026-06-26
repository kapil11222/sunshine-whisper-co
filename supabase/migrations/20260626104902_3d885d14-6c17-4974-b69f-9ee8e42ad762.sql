
CREATE POLICY "Owners can upload menu photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-photos' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update menu photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'menu-photos' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete menu photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-photos' AND public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Anyone authenticated can read menu photos"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'menu-photos');
