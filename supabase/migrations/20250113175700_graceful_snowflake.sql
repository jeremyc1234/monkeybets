/*
  # Final RLS policy fix for chimp_props table

  1. Changes
    - Drop existing policies
    - Add new policies with proper authentication handling
    - Enable anonymous access for read operations
    
  2. Security
    - Enable RLS
    - Allow anonymous read access
    - Restrict write operations to authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "public_read_access" ON chimp_props;
DROP POLICY IF EXISTS "authenticated_insert" ON chimp_props;
DROP POLICY IF EXISTS "creator_update" ON chimp_props;

-- Create new policies
CREATE POLICY "anon_read_access"
  ON chimp_props
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "auth_read_access"
  ON chimp_props
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_insert_access"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_update_access"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;