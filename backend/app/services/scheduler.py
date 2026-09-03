import asyncio
import logging
import os
from app.services.ingestion.manager import IngestionManager
from app.services.ingestion.open_meteo import OpenMeteoAdapter

logger = logging.getLogger(__name__)

# Initialize ingestion manager globally
ingestion_manager = IngestionManager()
ingestion_manager.register_adapter(OpenMeteoAdapter())

async def run_scheduler():
    interval_minutes = int(os.environ.get("WEATHER_INGESTION_INTERVAL_MINUTES", "10"))
    interval_seconds = interval_minutes * 60
    
    logger.info(f"[Scheduler] Starting ingestion scheduler (interval={interval_minutes}m)")
    
    while True:
        try:
            logger.info("[Scheduler] Triggering ingestion cycle...")
            await ingestion_manager.run_all()
        except Exception as e:
            logger.error(f"[Scheduler] Ingestion cycle failed: {e}")
            
        await asyncio.sleep(interval_seconds)
