-- Drop existing policies first
DROP POLICY IF EXISTS "allow_public_read" ON chimp_props;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON chimp_props;
DROP POLICY IF EXISTS "allow_creator_update" ON chimp_props;

-- Create new policies with proper authentication checks
CREATE POLICY "allow_public_read"
  ON chimp_props
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "allow_authenticated_insert"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_creator_update"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;