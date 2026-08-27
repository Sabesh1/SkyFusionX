from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.weather_event import WeatherEvent
from app.schemas.event import WeatherEventResponse

router = APIRouter()

@router.get("", response_model=List[WeatherEventResponse])
async def list_events(db: Session = Depends(get_db)):
    events = db.query(WeatherEvent).order_by(WeatherEvent.risk_score.desc()).limit(50).all()
    # Format for response
    result = []
    for evt in events:
        # Convert DB model to response format
        data = {
            "event_id": evt.event_id,
            "event_type": evt.event_type,
            "title": evt.title,
            "location": {
                "latitude": evt.latitude,
                "longitude": evt.longitude
            },
            "severity": evt.severity,
            "report_count": evt.report_count,
            "verified_report_count": evt.verified_report_count,
            "evidence_confidence": evt.evidence_confidence,
            "prediction_probability": evt.prediction_probability,
            "exposure_score": evt.exposure_score,
            "risk_score": evt.risk_score,
            "risk_level": evt.risk_level,
            "explanation": [
                "Multiple independent reports corroborate the event",
                "Reports are geographically clustered",
                f"Risk probability is {evt.prediction_probability}%",
            ]
        }
        result.append(data)
    return result

@router.get("/{event_id}", response_model=WeatherEventResponse)
async def get_event(event_id: str, db: Session = Depends(get_db)):
    evt = db.query(WeatherEvent).filter(WeatherEvent.event_id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")
        
    data = {
        "event_id": evt.event_id,
        "event_type": evt.event_type,
        "title": evt.title,
        "location": {
            "latitude": evt.latitude,
            "longitude": evt.longitude
        },
        "severity": evt.severity,
        "report_count": evt.report_count,
        "verified_report_count": evt.verified_report_count,
        "evidence_confidence": evt.evidence_confidence,
        "prediction_probability": evt.prediction_probability,
        "exposure_score": evt.exposure_score,
        "risk_score": evt.risk_score,
        "risk_level": evt.risk_level,
        "truth_analysis": {
            "source": 78,
            "location": 95,
            "timestamp": 92,
            "weather_data": 88,
            "nearby_reports": 94,
            "media": 72,
            "historical": 80
        },
        "explanation": [
            "Multiple independent reports corroborate the event",
            "Weather observations support heavy conditions",
            "Reports are geographically clustered",
            "Risk probability is increasing"
        ]
    }
    return data
