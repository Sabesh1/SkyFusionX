"""
DemoStreamManager — generates FRESH multi-source intelligence records on demand.

When the user clicks RESUME STREAM on the Live Intelligence page, this manager
starts an async loop that:
  1. Picks a random source adapter
  2. Generates 1 fresh record with current timestamps
  3. Inserts it into the DB
  4. Pushes it via SSE to all connected clients

When the user clicks PAUSE, the loop stops.

This replaces the old approach of replaying stale seed data.
"""
import asyncio
import logging
import uuid
import random
import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal
from app.models.observation import Observation
from app.api.stream import push_to_clients

logger = logging.getLogger(__name__)


def _build_fresh_record(source_data: dict) -> dict:
    """Ensure a generated record has all required fields with current timestamps."""
    now = datetime.datetime.utcnow()
    record = {**source_data}
    # Force current timestamps so Today filter always works
    record["observed_at"] = now - datetime.timedelta(seconds=random.randint(10, 120))
    record.setdefault("ingested_at", now)
    record.setdefault("id", str(uuid.uuid4()))
    record.setdefault("is_mock", True)
    record.setdefault("verification_status", "UNVERIFIED")
    return record


class DemoStreamManager:
    def __init__(self):
        self.is_running = False
        self.task = None
        self.streamed_ids: set = set()
        # Lazy-init adapters to avoid import loops at module level
        self._adapters = None

    def _get_adapters(self):
        """Lazy-load the simulated source adapters."""
        if self._adapters is None:
            from app.services.ingestion.simulated_sources import (
                CitizenReportAdapter,
                IMDAdapter,
                SocialMediaAdapter,
                PublicDatasetAdapter,
                NewsWebAdapter,
                SatelliteRadarAdapter,
            )
            from app.services.ingestion.open_meteo import OpenMeteoAdapter

            self._adapters = [
                ("citizen",         CitizenReportAdapter()),
                ("imd",             IMDAdapter()),
                ("social_media",    SocialMediaAdapter()),
                ("public_dataset",  PublicDatasetAdapter()),
                ("web",             NewsWebAdapter()),
                ("satellite",       SatelliteRadarAdapter()),
                # Include Open-Meteo in the rotation so real API data also streams
                ("weather_api",     OpenMeteoAdapter()),
            ]
        return self._adapters

    def start(self):
        if self.is_running:
            return
        logger.info("DemoStreamManager starting — will generate fresh multi-source records.")
        self.is_running = True
        self.task = asyncio.create_task(self._stream_loop())

    def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None
        logger.info("DemoStreamManager stopped.")

    # Expose queue property for backward compat with stream.py start endpoint
    @property
    def queue(self):
        return list(self.streamed_ids)

    async def _stream_loop(self):
        """Generate one fresh record every 5-8 seconds from a random source."""
        adapters = self._get_adapters()

        try:
            while self.is_running:
                source_name, adapter = random.choice(adapters)

                try:
                    # For Open-Meteo, just pick one city instead of all 10
                    if source_name == "weather_api":
                        city = random.choice(adapter.cities)
                        raw = await adapter.fetch_single(city)
                        if raw:
                            item = adapter.normalize(raw)
                        else:
                            continue
                    else:
                        raw_items = await adapter.fetch()
                        if not raw_items:
                            continue
                        item = adapter.normalize(random.choice(raw_items))

                    if not item:
                        continue

                    record = _build_fresh_record(item)

                    # Insert into DB
                    db = SessionLocal()
                    try:
                        valid_keys = {c.name for c in Observation.__table__.columns}
                        filtered = {k: v for k, v in record.items() if k in valid_keys}
                        obs = Observation(**filtered)
                        db.add(obs)
                        db.flush()
                        db.commit()
                        db.refresh(obs)
                        self.streamed_ids.add(obs.id)

                        # Push via SSE
                        await push_to_clients({
                            "type": "report_processed",
                            "event_id": obs.id,
                            "version": 2,
                            "source": obs.source,
                            "source_type": obs.source_type,
                            "city": obs.city or "Unknown",
                            "state": obs.state or "Unknown",
                            "district": obs.district,
                            "event_type": obs.event_type or "OTHER",
                            "content": obs.content,
                            "ml_event_type": obs.ml_event_type,
                            "ml_confidence": obs.ml_confidence,
                            "trust_score": obs.trust_score,
                            "verification_recommendation": obs.verification_recommendation,
                            "verification_assessment": obs.verification_assessment,
                            "verification_status": obs.verification_status,
                            "gemini_analyzed": obs.gemini_analyzed or False,
                            "image_analyzed": obs.image_analyzed or False,
                            "gemini_evidence_json": obs.gemini_evidence_json,
                            "timestamp": obs.observed_at.isoformat() if obs.observed_at else None,
                            "status": obs.verification_status,
                            "severity": obs.severity,
                            "model_version": obs.model_version,
                            "media_url": obs.media_url,
                            "is_mock": obs.is_mock,
                            "resolved_city": obs.resolved_city,
                            "resolved_state": obs.resolved_state,
                            "resolved_latitude": obs.resolved_latitude,
                            "resolved_longitude": obs.resolved_longitude,
                            "location_confidence": obs.location_confidence,
                            "is_duplicate": obs.is_duplicate or False,
                            "duplicate_of_id": obs.duplicate_of_id,
                            "duplicate_similarity": obs.duplicate_similarity,
                        })
                        logger.info(f"DemoStream: emitted {source_name} record {obs.id} ({obs.source})")
                    except IntegrityError:
                        db.rollback()
                        logger.debug(f"DemoStream: duplicate skipped for {source_name}")
                    except Exception as e:
                        db.rollback()
                        logger.error(f"DemoStream: DB error for {source_name}: {e}")
                    finally:
                        db.close()

                except Exception as e:
                    logger.error(f"DemoStream: adapter {source_name} failed: {e}")

                # Wait 5-8 seconds between emissions
                await asyncio.sleep(random.uniform(5, 8))

        except asyncio.CancelledError:
            logger.info("DemoStreamManager task cancelled.")
        except Exception as e:
            logger.error(f"DemoStreamManager fatal error: {e}", exc_info=True)
            self.is_running = False


demo_manager = DemoStreamManager()
