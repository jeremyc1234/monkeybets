/*
  # Fix RLS policies for chimp_props table

  1. Changes
    - Drop existing policies
    - Add new policies with proper access control
    - Allow public read access for active props
    - Restrict create/update to authenticated users
    
  2. Security
    - Enable RLS
    - Add policies for SELECT, INSERT, and UPDATE operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read props" ON chimp_props;
DROP POLICY IF EXISTS "Authenticated users can create props" ON chimp_props;
DROP POLICY IF EXISTS "Creators can update own props" ON chimp_props;

-- Create new policies
CREATE POLICY "Public read access for active props"
  ON chimp_props
  FOR SELECT
  TO public
  USING (
    CASE 
      WHEN auth.role() = 'authenticated' THEN true
      ELSE deleted_at IS NULL
    END
  );

CREATE POLICY "Authenticated users can create props"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
  );

CREATE POLICY "Creators can update their own props"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;