from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LocationInfo(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float
    longitude: float

class TruthAnalysis(BaseModel):
    source: float
    location: float
    timestamp: float
    weather_data: float
    nearby_reports: float
    media: float
    historical: float

class WeatherEventResponse(BaseModel):
    event_id: str
    event_type: str
    title: str
    location: LocationInfo
    severity: int
    report_count: int
    verified_report_count: int
    evidence_confidence: float
    prediction_probability: float
    exposure_score: float
    risk_score: float
    risk_level: str
    truth_analysis: Optional[TruthAnalysis] = None
    explanation: Optional[List[str]] = None

    class Config:
        from_attributes = True
