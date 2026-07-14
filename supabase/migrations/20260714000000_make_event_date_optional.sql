-- Migration: Make event_date, event_time, and duration columns optional in events table
-- Date: 2026-07-14
-- Description: Allow events to be created without a specific date, time, or duration

ALTER TABLE events 
ALTER COLUMN event_date DROP NOT NULL;

ALTER TABLE events 
ALTER COLUMN event_time DROP NOT NULL;

ALTER TABLE events 
ALTER COLUMN duration DROP NOT NULL;

-- Add comments to document these changes
COMMENT ON COLUMN events.event_date IS 'Optional event date. Can be NULL if date is not yet determined.';
COMMENT ON COLUMN events.event_time IS 'Optional event time. Can be NULL if time is not yet determined.';
COMMENT ON COLUMN events.duration IS 'Optional event duration in minutes. Can be NULL if duration is not yet determined.';
