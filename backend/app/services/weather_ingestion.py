"""
Weather Ingestion Worker
-------------------------
A background asyncio task that runs every WEATHER_REFRESH_INTERVAL_MINUTES.
Iterates through all cached Location records and updates their WeatherData.

On FastAPI startup this is launched via asyncio.create_task().
"""
import asyncio
import logging
import datetime

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.location import Location
from app.services import location_service

logger = logging.getLogger(__name__)

_ingestion_task: asyncio.Task = None


async def run_ingestion_cycle():
    """Perform one full ingestion cycle: fetch weather for all known locations."""
    logger.info("[Ingestion] Starting weather data refresh cycle...")
    db = SessionLocal()
    try:
        locations = db.query(Location).all()
        if not locations:
            logger.info("[Ingestion] No locations in registry yet. Skipping cycle.")
            return

        success = 0
        failures = 0
        for loc in locations:
            loc_dict = {
                "location_id": loc.location_id,
                "name": loc.name,
                "state": loc.admin1,
                "lat": loc.latitude,
                "lng": loc.longitude,
            }
            result = await asyncio.get_event_loop().run_in_executor(
                None, location_service.fetch_and_store_weather, loc_dict, db
            )
            if result:
                success += 1
            else:
                failures += 1

        logger.info(f"[Ingestion] Cycle complete. Success: {success}, Failures: {failures}")
    except Exception as e:
        logger.error(f"[Ingestion] Cycle error: {e}")
    finally:
        db.close()


async def ingestion_loop():
    """Loop forever, running ingestion every WEATHER_REFRESH_INTERVAL_MINUTES."""
    interval_seconds = settings.WEATHER_REFRESH_INTERVAL_MINUTES * 60
    logger.info(f"[Ingestion] Worker started. Refresh interval: {settings.WEATHER_REFRESH_INTERVAL_MINUTES} minutes.")

    while True:
        try:
            await run_ingestion_cycle()
        except Exception as e:
            logger.error(f"[Ingestion] Unexpected error in ingestion loop: {e}")

        await asyncio.sleep(interval_seconds)


def start_ingestion_worker():
    """Launch the background ingestion task. Call from FastAPI lifespan startup."""
    global _ingestion_task
    _ingestion_task = asyncio.create_task(ingestion_loop())
    logger.info("[Ingestion] Background ingestion worker task created.")


def stop_ingestion_worker():
    """Cancel the background task on shutdown."""
    global _ingestion_task
    if _ingestion_task and not _ingestion_task.done():
        _ingestion_task.cancel()
        logger.info("[Ingestion] Background ingestion worker stopped.")
