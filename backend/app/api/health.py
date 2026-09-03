from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter()

@router.get("/health")
@router.get("/ready")
async def health_check(db: Session = Depends(get_db)):
    # Check DB
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    # Check Kafka
    from app.services.kafka.producer import producer_service
    from app.services.kafka.consumer import consumer_service
    kafka_status = "healthy" if producer_service.connected else "unhealthy"
    consumer_status = "running" if consumer_service._running else "stopped"
    ml_status = "loaded" if consumer_service.ml_loaded else "unavailable"

    return {
        "status": "ok",
        "api": "healthy",
        "database": db_status,
        "kafka": kafka_status,
        "consumer": consumer_status,
        "ml": ml_status
    }
