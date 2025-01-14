/*
  # Add Prop Name to Bets Table

  1. Changes
    - Add prop_name column to bets table
    - Create trigger to automatically save prop name
    - Backfill existing bets with prop names
*/

-- Add prop_name column
ALTER TABLE bets
ADD COLUMN prop_name TEXT;

-- Create function to save prop name
CREATE OR REPLACE FUNCTION save_prop_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.prop_name := (
        SELECT name 
        FROM chimp_props 
        WHERE id = NEW.prop_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER save_prop_name_trigger
BEFORE INSERT ON bets
FOR EACH ROW
EXECUTE FUNCTION save_prop_name();

-- Backfill existing bets with prop names
UPDATE bets
SET prop_name = (
    SELECT name
    FROM chimp_props
    WHERE chimp_props.id = bets.prop_id
);