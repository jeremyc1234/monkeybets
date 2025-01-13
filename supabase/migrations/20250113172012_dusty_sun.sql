/*
  # Add authentication policies for monkeys table
  
  1. Security Changes
    - Add policies to allow user registration
    - Add policies to allow authentication
    - Add policies to allow profile updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Monkeys can read their own data" ON monkeys;

-- Add new policies
CREATE POLICY "Anyone can register"
  ON monkeys
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read monkeys for auth"
  ON monkeys
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update their own data"
  ON monkeys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);