from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.core.database import get_db
from app.models.observation import Observation
from app.models.weather_event import WeatherEvent

router = APIRouter()

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_reports = db.query(func.count(Observation.id)).scalar()
    verified_reports = db.query(func.count(Observation.id)).filter(Observation.verification_status == "VERIFIED").scalar()
    pending_reports = db.query(func.count(Observation.id)).filter(Observation.verification_status == "UNDER_REVIEW").scalar()
    rejected_reports = db.query(func.count(Observation.id)).filter(Observation.verification_status == "REJECTED").scalar()
    
    total_events = db.query(func.count(WeatherEvent.event_id)).scalar()
    
    # Simple aggregations
    state_distribution = dict(db.query(Observation.state, func.count(Observation.id)).group_by(Observation.state).all())
    event_distribution = dict(db.query(Observation.event_type, func.count(Observation.id)).group_by(Observation.event_type).all())
    severity_distribution = dict(db.query(Observation.severity, func.count(Observation.id)).group_by(Observation.severity).all())

    return {
        "total_reports": total_reports,
        "verified_reports": verified_reports,
        "pending_reports": pending_reports,
        "rejected_reports": rejected_reports,
        "total_events": total_events,
        "state_distribution": state_distribution,
        "event_distribution": event_distribution,
        "severity_distribution": severity_distribution
    }
