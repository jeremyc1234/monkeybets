-- Make pin_hash nullable
ALTER TABLE monkeys
ALTER COLUMN pin_hash DROP NOT NULL,
ALTER COLUMN pin_hash SET DEFAULT 'default';