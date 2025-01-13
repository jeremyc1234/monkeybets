/*
  # Fix RLS policies for chimp props

  1. Changes
    - Drop existing policies
    - Create new policies that allow proper access to chimp props
  
  2. Security
    - Enable proper read access for all users
    - Maintain creator-only update access
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active props" ON chimp_props;
DROP POLICY IF EXISTS "Anyone can create props" ON chimp_props;
DROP POLICY IF EXISTS "Creators can update their own props" ON chimp_props;

-- Create new policies
CREATE POLICY "Anyone can read props"
  ON chimp_props
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create props"
  ON chimp_props
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Creators can update own props"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());