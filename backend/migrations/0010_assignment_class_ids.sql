-- Add class_ids column to assignments table
-- Stores the class IDs that were used to create the assignment
-- This allows us to correctly pre-select classes when editing

ALTER TABLE assignments ADD COLUMN class_ids jsonb DEFAULT '[]'::jsonb;
