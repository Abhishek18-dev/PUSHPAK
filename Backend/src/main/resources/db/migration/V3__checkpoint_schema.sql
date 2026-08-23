-- V3__checkpoint_schema.sql
-- Add checkpoint_data to simulations to allow resuming after worker death

ALTER TABLE simulations ADD COLUMN checkpoint_data JSONB;
