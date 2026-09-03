# Kafka Real-Time Pipeline

## Architecture Overview

The system uses **Apache Kafka** in KRaft mode (no Zookeeper) as the central nervous system for all weather data ingestion. The pipeline enables real-time stream processing and guarantees safe database writes.

1. **Ingestion Sources (Producers)**
   - **Open-Meteo Scheduled Tasks**: Fetches 10 major cities periodically and publishes normalized JSON to the `weather-observations` topic.
   - **Citizen Reports API**: The React frontend sends reports via the `POST /api/v1/observations` endpoint. The FastAPI layer immediately publishes them to the `citizen-reports` topic.

2. **Stream Consumer**
   - An asynchronous Python `AIOKafkaConsumer` runs in a background task within the FastAPI event loop.
   - It subscribes to both topics, validates JSON payloads via Pydantic schemas, and writes them to the SQLite `observations` table using an ACID transaction.
   - **Offset Commit Strategy**: Kafka offsets are committed manually (`enable_auto_commit=False`) *only after* a successful database transaction. This prevents data loss.
   - **Idempotency**: SQLite `UniqueConstraint` on `(source, source_event_id)` handles deduplication. Duplicate events log a harmless warning and successfully acknowledge the offset.

3. **SSE Real-Time Broadcasting**
   - Once the database write is successful, the Consumer triggers `push_to_clients`, sending an SSE push message to the React Dashboard.

## Setup & Docker

To start the local Kafka broker:
```bash
cd backend
docker-compose up -d kafka
```

*Note: The system gracefully handles Kafka being offline. If the Kafka container stops, FastAPI will stay alive, reject incoming POST reports with `503 Service Unavailable`, and gracefully skip scheduled pulls until the connection is restored.*

## Kafka Topics Created
- `weather-observations`: For data retrieved by the Python scheduled adapter.
- `citizen-reports`: For human-reported ground truth inputs.

## Message Schema (Pydantic)
```json
{
  "event_id": "c3098553-cc72-4b2a-8cfa-55ba150d03b3",
  "source": "Citizen App",
  "source_event_id": "c3098553-cc72-4b2a-8cfa-55ba150d03b3",
  "timestamp": "2026-09-03T10:30:00Z",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "event_type": "Rainfall",
  "description": "Heavy flooding on Main Road",
  "verification_status": "UNVERIFIED",
  "source_type": "citizen",
  "severity": 4
}
```

## Monitoring Health
Access `GET /api/v1/health` or `GET /api/v1/ready` to view active connection statuses for Database, Kafka Producer, and Consumer Loop.
