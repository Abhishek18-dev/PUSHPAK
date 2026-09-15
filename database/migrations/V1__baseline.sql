-- V1__baseline.sql
-- Baseline migration for Flyway setup
CREATE TABLE IF NOT EXISTS flyway_baseline (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL
);
