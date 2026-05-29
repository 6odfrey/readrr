-- =====================================================
-- Readrr Phase 1: Allow users to insert their own profile
-- =====================================================

-- Drop if exists (for idempotency)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Policy: Users can create their own profile (id must match auth.uid)
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
