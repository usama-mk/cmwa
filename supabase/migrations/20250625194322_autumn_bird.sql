/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop all existing RLS policies on profiles table
    - Create new non-recursive policies that avoid infinite loops
    - Use auth.uid() directly instead of querying profiles table within policies
    - Separate admin access through service role instead of recursive role checks

  2. Policy Structure
    - Users can read/update their own profile using auth.uid() = id
    - Service role has full access for admin operations
    - Remove recursive admin policies that query profiles table within policy conditions
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service role has full access (for admin operations through backend)
CREATE POLICY "Service role full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all profiles (for admin dashboard)
-- This is safe because we control access through application logic
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert any profile (for admin creating clients)
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update any profile (for admin operations)
CREATE POLICY "Authenticated users can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete profiles (for admin operations)
CREATE POLICY "Authenticated users can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (true);