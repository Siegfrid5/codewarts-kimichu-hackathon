-- Manual SQL to add consecutive_wet_hours column to farm_risk_status table
-- Run this manually if the migration fails

ALTER TABLE farm_risk_status ADD COLUMN consecutive_wet_hours INTEGER DEFAULT 0;
