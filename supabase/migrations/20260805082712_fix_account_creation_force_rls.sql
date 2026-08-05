/*
# Fix account creation - remove FORCE RLS from profiles

## Problem
The second migration (`fix_auth_schema_grants`) applied `ALTER TABLE profiles FORCE ROW LEVEL SECURITY`.
This forces RLS to apply even to the table owner and SECURITY DEFINER functions. The `handle_new_user`
trigger function (owned by postgres) runs after a new auth.users row is created and tries to INSERT
into profiles. With FORCE RLS enabled, that INSERT is blocked because the trigger runs in a context
where `auth.uid()` is null (the user hasn't been assigned a session yet), so the `profiles_insert`
policy (`WITH CHECK (auth.uid() = id)`) fails. This causes every signup to return a 500
"Database error saving new user".

## Fix
- Remove `FORCE ROW LEVEL SECURITY` from profiles so the SECURITY DEFINER trigger function can
  bypass RLS and insert the profile row. RLS remains enabled (non-forced), so regular client
  queries are still subject to policies.
- Set `search_path` on the trigger function to close the mutable search_path security gap.
- Recreate the trigger to pick up the updated function definition.
*/

ALTER TABLE profiles NO FORCE ROW LEVEL SECURITY;

ALTER FUNCTION handle_new_user() SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
