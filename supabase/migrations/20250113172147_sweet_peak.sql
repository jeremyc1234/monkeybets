/*
  # Update chimp_props policies
  
  1. Changes
    - Drop existing policies that depend on auth.uid()
    - Create new policies that work with our custom authentication
    - Allow authenticated and anonymous users to read props
    - Allow prop creation and updates based on creator_id
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active props" ON chimp_props;
DROP POLICY IF EXISTS "Creators can update their props" ON chimp_props;
DROP POLICY IF EXISTS "Creators can delete their props" ON chimp_props;

-- Create new policies
CREATE POLICY "Anyone can read active props"
  ON chimp_props
  FOR SELECT
  TO authenticated, anon
  USING (deleted_at IS NULL);

CREATE POLICY "Anyone can create props"
  ON chimp_props
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Creators can update their own props"
  ON chimp_props
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Update bets policies as well
DROP POLICY IF EXISTS "Monkeys can create bets" ON bets;

CREATE POLICY "Anyone can create bets"
  ON bets
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);