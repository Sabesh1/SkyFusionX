import asyncio
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.observation import Observation
from app.api.stream import push_to_clients

logger = logging.getLogger(__name__)

class DemoStreamManager:
    def __init__(self):
        self.is_running = False
        self.task = None
        self.streamed_ids = set()
        self.queue = []

    def start(self):
        if self.is_running:
            return
        
        db = SessionLocal()
        try:
            # Fetch all mock observations that haven't been streamed yet
            mocks = db.query(Observation).filter(Observation.is_mock == True).order_by(Observation.ingested_at.asc()).all()
            self.queue = [m.id for m in mocks if m.id not in self.streamed_ids]
            
            # If all were streamed already, restart from beginning
            if not self.queue:
                logger.info("Demo stream queue empty, restarting sequence...")
                self.streamed_ids.clear()
                self.queue = [m.id for m in mocks]
                
            logger.info(f"DemoStreamManager starting with {len(self.queue)} reports queued.")
            self.is_running = True
            self.task = asyncio.create_task(self._stream_loop())
        finally:
            db.close()

    def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None
        logger.info("DemoStreamManager stopped.")

    async def _stream_loop(self):
        try:
            while self.is_running and self.queue:
                obs_id = self.queue.pop(0)
                self.streamed_ids.add(obs_id)
                
                db = SessionLocal()
                try:
                    obs = db.query(Observation).filter(Observation.id == obs_id).first()
                    if obs:
                        # Broadcast the observation using the standard SSE format
                        await push_to_clients({
                            "type": "report_processed",
                            "event_id": obs.id,
                            "source": obs.source,
                            "city": obs.city or obs.resolved_city or "Unknown",
                            "state": obs.state or obs.resolved_state or "Unknown",
                            "event_type": obs.event_type or "OTHER",
                            "content": obs.content,
                            "ml_event_type": obs.ml_event_type,
                            "ml_confidence": obs.ml_confidence,
                            "trust_score": obs.trust_score,
                            "verification_recommendation": obs.verification_recommendation,
                            "verification_assessment": obs.verification_assessment,
                            "gemini_analyzed": obs.gemini_analyzed,
                            "image_analyzed": obs.image_analyzed,
                            "gemini_evidence_json": obs.gemini_evidence_json,
                            "timestamp": obs.observed_at.isoformat() if obs.observed_at else None,
                            "status": obs.verification_status,
                            "severity": obs.severity,
                            "model_version": obs.model_version,
                            "media_url": obs.media_url,
                            "resolved_city": obs.resolved_city,
                            "resolved_state": obs.resolved_state,
                            "resolved_latitude": obs.resolved_latitude,
                            "resolved_longitude": obs.resolved_longitude,
                            "location_confidence": obs.location_confidence,
                            "is_duplicate": obs.is_duplicate,
                            "duplicate_of_id": obs.duplicate_of_id,
                            "duplicate_similarity": obs.duplicate_similarity,
                        })
                        logger.info(f"DemoStreamManager released report: {obs_id}")
                finally:
                    db.close()
                
                if self.queue:
                    await asyncio.sleep(6) # Configurable demo interval
                
            if self.is_running and not self.queue:
                # Finished queue naturally
                self.is_running = False
                self.task = None
                await push_to_clients({
                    "type": "demo_stream_complete",
                    "message": "Demo stream finished successfully"
                })
                logger.info("DemoStreamManager completed queue naturally.")
                
        except asyncio.CancelledError:
            logger.info("DemoStreamManager task cancelled.")
        except Exception as e:
            logger.error(f"DemoStreamManager error: {e}", exc_info=True)
            self.is_running = False

demo_manager = DemoStreamManager()
