-- RUN THIS IN SUPABASE SQL EDITOR
-- Fix RLS blocking cart inserts

-- Option 1: Disable RLS completely (quick fix for testing)
ALTER TABLE donhang DISABLE ROW LEVEL SECURITY;
ALTER TABLE chitietdonhang DISABLE ROW LEVEL SECURITY;

-- Option 2: Add service role policies (recommended for production)
-- Uncomment below if you want to keep RLS enabled:

/*
-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "service_role_all" ON donhang;
DROP POLICY IF EXISTS "service_role_all" ON chitietdonhang;

-- Add new policies allowing service role full access
CREATE POLICY "service_role_all" ON donhang
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_all" ON chitietdonhang
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Also allow authenticated users to read/write their own cart
CREATE POLICY "users_own_cart" ON donhang
FOR ALL
TO authenticated
USING (makhachhang = auth.uid()::int)
WITH CHECK (makhachhang = auth.uid()::int);

CREATE POLICY "users_own_cart_items" ON chitietdonhang
FOR ALL
TO authenticated
USING (
  madonhang IN (
    SELECT madonhang FROM donhang WHERE makhachhang = auth.uid()::int
  )
)
WITH CHECK (
  madonhang IN (
    SELECT madonhang FROM donhang WHERE makhachhang = auth.uid()::int
  )
);
*/

-- Verify RLS status
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('donhang', 'chitietdonhang');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('donhang', 'chitietdonhang')
ORDER BY tablename, policyname;
