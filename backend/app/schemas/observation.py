from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ObservationCreate(BaseModel):
    source: str = Field(..., description="Source of the report (IMD, WeatherAPI, Citizen, Social)")
    source_event_id: str = Field(..., description="Unique ID from the source")
    observed_at: datetime
    content: str
    latitude: float
    longitude: float
    city: Optional[str] = None
    state: Optional[str] = None
    media_url: Optional[str] = None
    is_mock: bool = False

class ObservationResponse(ObservationCreate):
    id: str
    ingested_at: datetime
    event_type: Optional[str] = None
    severity: Optional[int] = None
    trust_score: Optional[float] = None
    verification_status: Optional[str] = None
    
    class Config:
        from_attributes = True
