import asyncio
import logging
import os
from app.services.ingestion.manager import IngestionManager
from app.services.ingestion.open_meteo import OpenMeteoAdapter
from app.services.ingestion.social_media import IMDSocialMediaAdapter
from app.services.ingestion.simulated_sources import (
    CitizenReportAdapter,
    IMDAdapter,
    SocialMediaAdapter,
    PublicDatasetAdapter,
    NewsWebAdapter,
    SatelliteRadarAdapter
)

logger = logging.getLogger(__name__)

# Initialize ingestion manager globally
ingestion_manager = IngestionManager()
ingestion_manager.register_adapter(OpenMeteoAdapter())
ingestion_manager.register_adapter(IMDSocialMediaAdapter())
ingestion_manager.register_adapter(CitizenReportAdapter())
ingestion_manager.register_adapter(IMDAdapter())
ingestion_manager.register_adapter(SocialMediaAdapter())
ingestion_manager.register_adapter(PublicDatasetAdapter())
ingestion_manager.register_adapter(NewsWebAdapter())
ingestion_manager.register_adapter(SatelliteRadarAdapter())

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
