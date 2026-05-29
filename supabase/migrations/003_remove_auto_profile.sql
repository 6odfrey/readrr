-- =====================================================
-- Readrr Phase 1: Remove auto-profile creation trigger
-- We want users to choose their own username during signup
-- =====================================================

-- Remove the auto-create profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now the app will manually create the user profile after
-- the user chooses their username in step 2 of signup
