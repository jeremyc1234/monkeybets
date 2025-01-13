/*
  # Add Phone Authentication Support
  
  1. Changes
    - Add phone_number verification fields to monkeys table
    - Add verification status tracking
    - Add last verification attempt timestamp
  
  2. Security
    - Maintain existing RLS policies
    - Add new policies for phone verification
*/

ALTER TABLE monkeys
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_code text,
ADD COLUMN IF NOT EXISTS verification_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt timestamptz,
ADD COLUMN IF NOT EXISTS verification_code_expires_at timestamptz;

-- Add policy for phone verification
CREATE POLICY "Allow users to update their verification status"
ON monkeys
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());