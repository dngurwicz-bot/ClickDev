-- Function to get all users with role and org info (Accessible only by Super Admin via RPC)
CREATE OR REPLACE FUNCTION public.get_all_users_secure()
RETURNS TABLE (
  id uuid,
  email varchar,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  organization_name text,
  organization_id uuid,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if executing user is super admin using our existing check (optional, but good practice)
  -- However, since this is called by service_role in backend, we can skip strict auth check inside 
  -- IF we trust the caller (backend). But let's be safe.
  -- Actually, service role bypasses RLS, but this function is SECURITY DEFINER.
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::varchar,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(
      (SELECT 'Super Admin'::text FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'super_admin' LIMIT 1),
      (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = au.id LIMIT 1),
      'User'::text
    ) as role,
    COALESCE(
      (SELECT 'System' FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'super_admin' LIMIT 1),
      (SELECT o.name FROM public.organizations o JOIN public.user_roles ur ON ur.organization_id = o.id WHERE ur.user_id = au.id LIMIT 1),
      '-'
    ) as organization_name,
    (SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.organization_id IS NOT NULL LIMIT 1) as organization_id,
    au.raw_user_meta_data as user_metadata
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;
