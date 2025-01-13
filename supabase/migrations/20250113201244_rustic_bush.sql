-- Enable auth schema if not already enabled
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth schema tables if they don't exist
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  created_at timestamptz DEFAULT now()
);

-- Update RLS policies for monkeys table
DROP POLICY IF EXISTS "allow_phone_auth" ON monkeys;
DROP POLICY IF EXISTS "allow_phone_registration" ON monkeys;

CREATE POLICY "allow_authenticated_read"
  ON monkeys
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_authenticated_insert"
  ON monkeys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update RLS policies for chimp_props
DROP POLICY IF EXISTS "allow_public_read" ON chimp_props;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON chimp_props;
DROP POLICY IF EXISTS "allow_creator_update" ON chimp_props;

CREATE POLICY "allow_authenticated_read"
  ON chimp_props
  FOR SELECT
  TO authenticated
  USING (true);

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

DROP POLICY IF EXISTS "allow_creator_soft_delete" ON chimp_props;
CREATE POLICY "allow_creator_soft_delete"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE monkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;