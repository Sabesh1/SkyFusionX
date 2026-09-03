from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from app.core.config import settings
from app.core.database import engine, Base
import app.models.observation
import app.models.weather_event
import app.models.alert
import app.models.location
import app.models.weather_data

from app.services.kafka.producer import producer_service
from app.services.kafka.consumer import consumer_service
from app.api import health, observations, events, alerts, stream, copilot, auth, dashboard, locations

from app.services.scheduler import run_scheduler
import asyncio

_scheduler_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist (includes new Location + WeatherData)
    Base.metadata.create_all(bind=engine)
    
    # Start Kafka Producer
    await producer_service.start()
    
    # Start Kafka Consumer
    await consumer_service.start()

    # Start real-world weather ingestion background worker
    global _scheduler_task
    _scheduler_task = asyncio.create_task(run_scheduler())
    yield
    # Shutdown: Stop ingestion and Kafka clients
    if _scheduler_task:
        _scheduler_task.cancel()
    
    await producer_service.stop()
    await consumer_service.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="SIH 2026 - National AI Weather Intelligence & Truth Engine API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(observations.router, prefix="/api/v1/observations", tags=["Observations"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(stream.router, prefix="/api/v1/events", tags=["Real-Time Stream"])
app.include_router(copilot.router, prefix="/api/v1/copilot", tags=["Copilot"])
