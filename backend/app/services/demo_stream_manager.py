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
            
            # If all were streamed already, do not restart
            if not self.queue:
                logger.info("Demo stream queue empty, sequence already completed.")
                return
                
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
                        # Clone the mock observation so it enters the real ingestion pipeline
                        import uuid
                        import datetime
                        
                        new_id = f"DEMO-{uuid.uuid4().hex[:8].upper()}"
                        new_obs = Observation(
                            id=new_id,
                            source=obs.source,
                            source_event_id=f"DEMO-{uuid.uuid4().hex[:8].upper()}",
                            observed_at=datetime.datetime.utcnow(),
                            ingested_at=datetime.datetime.utcnow(),
                            content=obs.content,
                            latitude=obs.latitude,
                            longitude=obs.longitude,
                            city=obs.city,
                            district=obs.district,
                            state=obs.state,
                            event_type=obs.event_type,
                            severity=obs.severity,
                            is_mock=False, # Treat as real data in the pipeline
                            verification_status="PROCESSING",
                            media_url=obs.media_url
                        )
                        db.add(new_obs)
                        db.commit()
                        
                        # Trigger the REAL background pipeline
                        from app.api.observations import process_report_background
                        asyncio.create_task(process_report_background(new_id, None))
                        
                        logger.info(f"DemoStreamManager injected cloned report into pipeline: {new_id} (from {obs_id})")
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
