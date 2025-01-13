/*
  # Fix monkeys table schema
  
  1. Changes
    - Update id column to use gen_random_uuid() as default
    - Remove auth.uid() default as we're not using Supabase Auth
*/

ALTER TABLE monkeys 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  DROP CONSTRAINT IF EXISTS monkeys_id_fkey;