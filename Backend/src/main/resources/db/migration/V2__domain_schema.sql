-- V2__domain_schema.sql
-- Full domain schema for RF Scheduler Backend

-- Simulations
CREATE TABLE simulations (
    id              VARCHAR(20)     PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    seed            BIGINT          NOT NULL DEFAULT 42,
    bands           INTEGER         NOT NULL DEFAULT 16,
    duration_steps  INTEGER         NOT NULL DEFAULT 2000,
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft',
    current_step    BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Emitters (linked to simulation)
CREATE TABLE emitters (
    id              VARCHAR(20)     PRIMARY KEY,
    simulation_id   VARCHAR(20)     NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    behavior_class  VARCHAR(20)     NOT NULL,
    band            INTEGER         NOT NULL DEFAULT 0,
    period          INTEGER         NOT NULL DEFAULT 10,
    priority        DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    config_json     JSONB,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Receiver configurations
CREATE TABLE receiver_configs (
    id              VARCHAR(20)     PRIMARY KEY,
    simulation_id   VARCHAR(20)     NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    bandwidth_k     INTEGER         NOT NULL DEFAULT 1,
    dwell_ms        INTEGER         NOT NULL DEFAULT 10,
    tuning_delay    INTEGER         NOT NULL DEFAULT 2,
    threshold       DOUBLE PRECISION NOT NULL DEFAULT 0.5
);

-- Scan events
CREATE TABLE scan_events (
    id              BIGSERIAL       PRIMARY KEY,
    simulation_id   VARCHAR(20)     NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    t               BIGINT          NOT NULL,
    band            INTEGER         NOT NULL,
    policy_type     VARCHAR(20)     NOT NULL DEFAULT 'baseline',
    dwell_used      INTEGER         NOT NULL DEFAULT 10
);

-- Detection events
CREATE TABLE detection_events (
    id              BIGSERIAL       PRIMARY KEY,
    scan_event_id   BIGINT          NOT NULL REFERENCES scan_events(id) ON DELETE CASCADE,
    type            VARCHAR(4)      NOT NULL,
    latency_ms      BIGINT
);

-- Scheduler decisions
CREATE TABLE scheduler_decisions (
    id              BIGSERIAL       PRIMARY KEY,
    scan_event_id   BIGINT          NOT NULL REFERENCES scan_events(id) ON DELETE CASCADE,
    state_vector    JSONB,
    action          JSONB           NOT NULL,
    reward          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    model_id        VARCHAR(50),
    decision_id     VARCHAR(50)
);

-- Models (ML model registry)
CREATE TABLE models (
    id              VARCHAR(50)     PRIMARY KEY,
    algorithm       VARCHAR(20)     NOT NULL,
    version         INTEGER         NOT NULL DEFAULT 1,
    hyperparams     JSONB,
    active          BOOLEAN         NOT NULL DEFAULT false,
    metrics_json    JSONB,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Experiments
CREATE TABLE experiments (
    id              VARCHAR(20)     PRIMARY KEY,
    name            VARCHAR(255),
    scenario        VARCHAR(2)      NOT NULL,
    policies        JSONB           NOT NULL DEFAULT '["baseline"]',
    status          VARCHAR(20)     NOT NULL DEFAULT 'created',
    config_json     JSONB,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Experiment runs (one per policy in an experiment)
CREATE TABLE experiment_runs (
    id              BIGSERIAL       PRIMARY KEY,
    experiment_id   VARCHAR(20)     NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    policy_type     VARCHAR(20)     NOT NULL,
    simulation_id   VARCHAR(20)     REFERENCES simulations(id),
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending',
    metrics_json    JSONB,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_emitters_sim ON emitters(simulation_id);
CREATE INDEX idx_scan_events_sim ON scan_events(simulation_id);
CREATE INDEX idx_scan_events_sim_t ON scan_events(simulation_id, t);
CREATE INDEX idx_detection_events_scan ON detection_events(scan_event_id);
CREATE INDEX idx_scheduler_decisions_scan ON scheduler_decisions(scan_event_id);
CREATE INDEX idx_models_algorithm_active ON models(algorithm, active);
CREATE INDEX idx_experiment_runs_exp ON experiment_runs(experiment_id);
