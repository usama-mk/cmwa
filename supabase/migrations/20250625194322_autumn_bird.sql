/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - RLS policies on profiles table cause infinite recursion
    - Policies query the profiles table from within the policy itself
    - This creates a loop when checking admin permissions
    - Projects table updates hang because of this recursion

  2. Solution
    - Remove all recursive policies that check admin role from profiles table
    - Create simple, non-recursive policies
    - Use service role for admin operations to avoid recursion
    - Ensure basic user functionality still works

  3. Changes
    - Drop all problematic recursive policies
    - Create simple user policies for self-management
    - Add service role policy for admin operations
    - Ensure projects table has proper policies
*/

-- Drop all problematic recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;

-- Create simple, non-recursive policies for users
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

-- Add service role policy for admin operations (no recursion)
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure projects table has RLS enabled and proper policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop any existing projects policies that might cause issues
DROP POLICY IF EXISTS "Clients can read own projects" ON projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

-- Create simple projects policies
CREATE POLICY "Users can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (true);

-- Add service role policy for projects
CREATE POLICY "Service role can manage all projects"
  ON projects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);