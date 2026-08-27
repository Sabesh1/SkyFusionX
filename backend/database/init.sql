CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS observations (
    id VARCHAR PRIMARY KEY,
    source VARCHAR NOT NULL,
    source_event_id VARCHAR NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL,
    content TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    city VARCHAR,
    district VARCHAR,
    state VARCHAR,
    event_type VARCHAR,
    severity INTEGER,
    trust_score DOUBLE PRECISION,
    verification_status VARCHAR,
    media_url VARCHAR,
    is_mock BOOLEAN DEFAULT FALSE,
    raw_payload JSONB,
    content_hash VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_event_id)
);

CREATE TABLE IF NOT EXISTS weather_events (
    event_id VARCHAR PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    title VARCHAR,
    severity INTEGER,
    status VARCHAR,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    affected_area_sq_km DOUBLE PRECISION,
    report_count INTEGER DEFAULT 0,
    verified_report_count INTEGER DEFAULT 0,
    evidence_confidence DOUBLE PRECISION,
    prediction_probability DOUBLE PRECISION,
    exposure_score DOUBLE PRECISION,
    risk_score DOUBLE PRECISION,
    risk_level VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR PRIMARY KEY,
    event_id VARCHAR NOT NULL,
    alert_level VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    risk_score DOUBLE PRECISION,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR,
    language VARCHAR DEFAULT 'en',
    FOREIGN KEY (event_id) REFERENCES weather_events(event_id)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weather_events_modtime
BEFORE UPDATE ON weather_events
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
