/*
  # Update authentication and foreign key relationships

  1. Changes
    - Enable auth schema
    - Update foreign key constraints
    - Update policies to work with auth.uid()
    - Ensure proper authentication flow
*/

-- Enable auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can update their own data" ON monkeys;
DROP POLICY IF EXISTS "Anyone can register" ON monkeys;
DROP POLICY IF EXISTS "Anyone can read monkeys for auth" ON monkeys;
DROP POLICY IF EXISTS "Allow users to update their verification status" ON monkeys;

-- Drop foreign key constraints first
ALTER TABLE chimp_props
DROP CONSTRAINT IF EXISTS chimp_props_creator_id_fkey;

ALTER TABLE bets
DROP CONSTRAINT IF EXISTS bets_monkey_id_fkey;

-- Now update the monkeys table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new UUID column
ALTER TABLE monkeys 
ADD COLUMN new_id uuid DEFAULT uuid_generate_v4();

-- Copy existing IDs to new column
UPDATE monkeys 
SET new_id = id::uuid 
WHERE id IS NOT NULL;

-- Update references in chimp_props
UPDATE chimp_props 
SET creator_id = m.new_id 
FROM monkeys m 
WHERE m.id::text = creator_id::text;

-- Update references in bets
UPDATE bets 
SET monkey_id = m.new_id 
FROM monkeys m 
WHERE m.id::text = monkey_id::text;

-- Drop old column and rename new one (separate statements)
ALTER TABLE monkeys 
DROP COLUMN id;

ALTER TABLE monkeys 
ALTER COLUMN new_id SET NOT NULL,
ALTER COLUMN new_id SET DEFAULT uuid_generate_v4();

ALTER TABLE monkeys 
ADD CONSTRAINT monkeys_pkey PRIMARY KEY (new_id);

ALTER TABLE monkeys 
RENAME COLUMN new_id TO id;

-- Recreate foreign key constraints
ALTER TABLE chimp_props
ADD CONSTRAINT chimp_props_creator_id_fkey 
FOREIGN KEY (creator_id) 
REFERENCES monkeys(id);

ALTER TABLE bets
ADD CONSTRAINT bets_monkey_id_fkey 
FOREIGN KEY (monkey_id) 
REFERENCES monkeys(id);

-- Re-create the policies with the new UUID type
CREATE POLICY "allow_public_read"
  ON monkeys
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "allow_self_update"
  ON monkeys
  FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "allow_registration"
  ON monkeys
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update chimp_props policies
DROP POLICY IF EXISTS "allow_public_read" ON chimp_props;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON chimp_props;
DROP POLICY IF EXISTS "allow_creator_update" ON chimp_props;

CREATE POLICY "allow_public_read"
  ON chimp_props
  FOR SELECT
  TO public
  USING (deleted_at IS NULL);

CREATE POLICY "allow_authenticated_insert"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id::text = auth.uid()::text);

CREATE POLICY "allow_creator_update"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id::text = auth.uid()::text)
  WITH CHECK (creator_id::text = auth.uid()::text);

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;
ALTER TABLE monkeys ENABLE ROW LEVEL SECURITY;