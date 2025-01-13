/*
  # Fix RLS policies for chimp props

  1. Changes
    - Drop existing policies
    - Create new simplified policies for CRUD operations
    - Ensure proper authentication checks
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Allow public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "public_read_access" ON chimp_props;
DROP POLICY IF EXISTS "anon_read_access" ON chimp_props;
DROP POLICY IF EXISTS "auth_read_access" ON chimp_props;
DROP POLICY IF EXISTS "auth_insert_access" ON chimp_props;
DROP POLICY IF EXISTS "auth_update_access" ON chimp_props;

-- Create new policies
CREATE POLICY "allow_public_read"
  ON chimp_props
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "allow_authenticated_insert"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid() AND
    deleted_at IS NULL
  );

CREATE POLICY "allow_creator_update"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;