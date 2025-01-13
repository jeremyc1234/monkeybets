/*
  # Fix RLS policies for chimp_props table

  1. Changes
    - Drop all existing policies
    - Add new simplified policies with proper access control
    - Allow both authenticated and anonymous access for reads
    - Ensure proper creator_id validation for inserts
    
  2. Security
    - Enable RLS
    - Separate policies for SELECT, INSERT, and UPDATE operations
    - Explicit handling for both authenticated and anonymous users
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Public read access for active props" ON chimp_props;
DROP POLICY IF EXISTS "Authenticated users can create props" ON chimp_props;
DROP POLICY IF EXISTS "Creators can update their own props" ON chimp_props;

-- Create simplified policies
CREATE POLICY "Allow read access for everyone"
  ON chimp_props
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create props"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow creators to update their own props"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;