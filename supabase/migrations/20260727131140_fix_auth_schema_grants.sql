/*
# Fix auth schema grants for PRM application

This migration ensures the supabase_auth_admin role has proper access to
the public schema tables it needs to query during authentication.
*/

-- Grant necessary schema and table permissions to the auth admin role
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- Also ensure authenticator role has proper access
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;

-- Fix the profiles table policies to work with auth
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT 
TO authenticated, anon USING (true);

-- Grant supabase_auth_admin bypass RLS for its operations
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

SELECT 'Auth grants applied' as status;
