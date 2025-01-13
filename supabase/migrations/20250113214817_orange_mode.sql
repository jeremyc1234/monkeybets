/*
  # Fix Shared Prop View Policies

  1. Changes
    - Drop existing policies
    - Create new simplified policies for public and authenticated access
    - Ensure proper handling of deleted props
*/

-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_read" ON chimp_props;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON chimp_props;
DROP POLICY IF EXISTS "allow_creator_update" ON chimp_props;
DROP POLICY IF EXISTS "Anyone can view non-deleted props" ON chimp_props;

-- Create new simplified policies
CREATE POLICY "public_read_access"
  ON chimp_props
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "authenticated_read_access"
  ON chimp_props
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL OR creator_id = auth.uid());

CREATE POLICY "authenticated_insert"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "creator_update"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;