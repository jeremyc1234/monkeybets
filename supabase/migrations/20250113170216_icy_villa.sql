/*
  # Initial Schema for MonkeyBets

  1. New Tables
    - `monkeys` (users)
      - `id` (uuid, primary key)
      - `phone` (text, unique)
      - `pin_hash` (text)
      - `created_at` (timestamp)
    
    - `chimp_props` (betting propositions)
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references monkeys)
      - `name` (text)
      - `expiry_date` (timestamp)
      - `result` (boolean, null until resolved)
      - `created_at` (timestamp)
      - `deleted_at` (timestamp, null if active)
    
    - `bets` (wagers on props)
      - `id` (uuid, primary key)
      - `prop_id` (uuid, references chimp_props)
      - `monkey_id` (uuid, references monkeys)
      - `prediction` (boolean)
      - `bananas` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create monkeys table
CREATE TABLE monkeys (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  phone text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create chimp_props table
CREATE TABLE chimp_props (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES monkeys NOT NULL,
  name text NOT NULL,
  expiry_date timestamptz NOT NULL,
  result boolean,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT future_expiry CHECK (expiry_date > created_at)
);

-- Create bets table
CREATE TABLE bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_id uuid REFERENCES chimp_props NOT NULL,
  monkey_id uuid REFERENCES monkeys NOT NULL,
  prediction boolean NOT NULL,
  bananas integer NOT NULL CHECK (bananas > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE monkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimp_props ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Policies for monkeys
CREATE POLICY "Monkeys can read their own data"
  ON monkeys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policies for chimp_props
CREATE POLICY "Anyone can read active props"
  ON chimp_props
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Creators can update their props"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their props"
  ON chimp_props
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id AND deleted_at IS NULL);

-- Policies for bets
CREATE POLICY "Anyone can read bets"
  ON bets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Monkeys can create bets"
  ON bets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = monkey_id AND
    NOT EXISTS (
      SELECT 1 FROM chimp_props
      WHERE id = prop_id AND creator_id = auth.uid()
    )
  );