import logging
import uuid
import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal
from app.models.observation import Observation
from app.services.ingestion.base import BaseIngestionAdapter

logger = logging.getLogger(__name__)

class IngestionManager:
    def __init__(self):
        self.adapters: List[BaseIngestionAdapter] = []

    def register_adapter(self, adapter: BaseIngestionAdapter):
        self.adapters.append(adapter)

    async def run_all(self):
        """
        Run all registered adapters and publish normalized observations to Kafka.
        """
        from app.services.kafka.producer import producer_service
        from app.services.kafka.schemas import WeatherObservationEvent
        from app.services.kafka.topics import TOPIC_WEATHER_OBSERVATIONS

        try:
            for adapter in self.adapters:
                logger.info(f"[Ingestion] Running adapter {adapter.__class__.__name__}")
                try:
                    items = await adapter.ingest()
                    for item in items:
                        # Build Kafka message schema
                        event = WeatherObservationEvent(
                            event_id=item["source_event_id"],
                            source=item["source"],
                            source_event_id=item["source_event_id"],
                            timestamp=item["observed_at"],
                            city=item.get("city", "Unknown"),
                            state=item.get("state", "Unknown"),
                            latitude=item.get("latitude", 0.0),
                            longitude=item.get("longitude", 0.0),
                            event_type=item.get("event_type", "OTHER"),
                            description=item.get("content", ""),
                            verification_status="UNVERIFIED",
                            severity=item.get("severity", 1)
                        )
                        # Publish to Kafka
                        await producer_service.publish(TOPIC_WEATHER_OBSERVATIONS, event)
                except Exception as e:
                    logger.error(f"[Ingestion] Error running adapter {adapter.__class__.__name__}: {e}")
        except Exception as e:
            logger.error(f"[Ingestion] Fatal error in run_all: {e}")

    def _save_observation(self, db: Session, item: dict):
        """
        Save a single normalized observation dict to DB.
        Prevents duplicates by relying on the DB UniqueConstraint for source + source_event_id.
        """
        # Ensure we have an ingested_at and id
        item.setdefault("ingested_at", datetime.datetime.utcnow())
        item.setdefault("id", str(uuid.uuid4()))

        obs = Observation(**item)
        db.add(obs)
        try:
            # We flush so that if there's an IntegrityError (duplicate source_event_id), we catch it immediately.
            db.flush()
            
            # If successful, we can emit an SSE
            # Note: We can't easily call async from synchronous _save_observation
            # We'll return the item and emit it from the caller
            return item
        except IntegrityError:
            db.rollback()
            logger.debug(f"[Ingestion] Skipped duplicate observation from {item.get('source')} (event_id={item.get('source_event_id')})")
        except Exception as e:
            db.rollback()
            logger.error(f"[Ingestion] Error saving observation: {e}")
        return None
