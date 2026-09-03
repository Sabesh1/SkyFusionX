import asyncio
from app.services.ingestion.manager import IngestionManager
from app.services.ingestion.open_meteo import OpenMeteoAdapter
import logging

logging.basicConfig(level=logging.INFO)

async def test_ingest():
    from app.services.kafka.producer import producer_service
    await producer_service.start()
    manager = IngestionManager()
    manager.register_adapter(OpenMeteoAdapter())
    await manager.run_all()
    await producer_service.stop()
    print("Ingestion test completed.")

if __name__ == "__main__":
    asyncio.run(test_ingest())
