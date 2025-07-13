/*
  # Fix admin client creation functionality

  1. Security Changes
    - Add policy to allow admins to insert profiles for new clients
    - Add policy to allow admins to delete profiles (for client management)
    - Ensure admins can manage all client data
    - Keep existing user self-management policies

  2. Policy Changes
    - Admins can insert profiles for any user (needed for client creation)
    - Admins can delete profiles (needed for client deletion)
    - Admins can read all profiles (already working)
    - Users can still manage their own profiles
*/

-- Add policy for admins to insert profiles for any user (needed for client creation)
CREATE POLICY "Admins can insert any profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Add policy for admins to delete profiles
CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Add policy for admins to read all profiles (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can read all profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles admin_profile 
          WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role = 'admin'
        )
      );
  END IF;
END $$;

-- Add policy for admins to update all profiles (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles admin_profile 
          WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles admin_profile 
          WHERE admin_profile.id = auth.uid() 
          AND admin_profile.role = 'admin'
        )
      );
  END IF;
END $$;