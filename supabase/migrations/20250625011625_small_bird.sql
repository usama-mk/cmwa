/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current RLS policies on profiles table cause infinite recursion
    - Policies query the profiles table from within the policy itself
    - This creates a loop when checking admin permissions

  2. Solution
    - Remove the recursive policies that check admin role from profiles table
    - Keep simple policies for users to manage their own profiles
    - Admin access will be handled at the application level or through service role

  3. Changes
    - Drop problematic admin policies that cause recursion
    - Keep basic user policies for self-management
    - Ensure users can still read and update their own profiles
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Keep the basic user policies (these don't cause recursion)
-- Users can read their own profile - already exists
-- Users can update their own profile - already exists
-- Users can insert their own profile - already exists

-- Add a simple policy for service role access (for admin operations)
-- This allows the application to handle admin operations through service role
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);