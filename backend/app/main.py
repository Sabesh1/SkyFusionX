from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

from app.core.config import settings
from stream.app import stream_client
from stream.processor import start_processors
from app.api import health, observations, events, alerts, stream

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Kafka clients and stream processors
    await start_processors()
    yield
    # Shutdown: Stop Kafka clients
    await stream_client.disconnect()

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
app.include_router(observations.router, prefix="/api/v1/observations", tags=["Observations"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(stream.router, prefix="/api/v1/events", tags=["Real-Time Stream"])
