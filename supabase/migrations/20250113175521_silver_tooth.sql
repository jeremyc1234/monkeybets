/*
  # Fix RLS policies for chimp_props table

  1. Changes
    - Drop existing policies
    - Add new policies with proper public access
    - Ensure proper authentication handling
    
  2. Security
    - Enable RLS
    - Allow public read access
    - Maintain secure write operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for everyone" ON chimp_props;
DROP POLICY IF EXISTS "Allow authenticated users to create props" ON chimp_props;
DROP POLICY IF EXISTS "Allow creators to update their own props" ON chimp_props;

-- Create new policies with proper public access
CREATE POLICY "public_read_access"
  ON chimp_props
  FOR SELECT
  TO public
  USING (true);

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